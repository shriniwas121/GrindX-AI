import io
import os
import math
from fastapi import HTTPException, Request
import azure.cognitiveservices.speech as speechsdk
from fastapi.responses import Response, JSONResponse
import re
import os
from fastapi import Form
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from openai import AzureOpenAI
from youtube_transcript_api import YouTubeTranscriptApi
from urllib.parse import urlparse, parse_qs
import requests
from bs4 import BeautifulSoup
from azure.ai.documentintelligence import DocumentIntelligenceClient
from azure.core.credentials import AzureKeyCredential
import base64
from docx import Document
from datetime import datetime, timezone
import stripe
from typing import Optional

try:
    from pypdf import PdfReader
except Exception:
    PdfReader = None

load_dotenv()


app = FastAPI(title="GrindX AI Backend")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://grindx.insightxai.com.au",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
STRIPE_PRICE_ID_PREMIUM = os.getenv("STRIPE_PRICE_ID_PREMIUM", "")
STRIPE_PRICE_ID_PRO = os.getenv("STRIPE_PRICE_ID_PRO", "")
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:3000")

stripe.api_key = STRIPE_SECRET_KEY

print("=== STRIPE DEBUG START ===")
print("STRIPE_SECRET_KEY PREFIX:", STRIPE_SECRET_KEY[:8] if STRIPE_SECRET_KEY else "EMPTY")
print("STRIPE_PRICE_ID_PREMIUM:", STRIPE_PRICE_ID_PREMIUM)
print("STRIPE_PRICE_ID_PRO:", STRIPE_PRICE_ID_PRO)
print("FRONTEND_BASE_URL:", FRONTEND_BASE_URL)
print("=== STRIPE DEBUG END ===")


def log_usage_to_supabase(user_id: str, source_type: str, file_name: str | None = None):
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY or not user_id:
        return

    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }

    today = datetime.now(timezone.utc).date().isoformat()

    try:
        # 1) log upload row
        requests.post(
            f"{SUPABASE_URL}/rest/v1/uploads",
            headers=headers,
            json={
                "user_id": user_id,
                "file_name": file_name,
                "source_type": source_type,
            },
            timeout=10,
        )

        # 2) read existing daily_usage row
        existing_res = requests.get(
            f"{SUPABASE_URL}/rest/v1/daily_usage?user_id=eq.{user_id}&usage_date=eq.{today}&select=id,upload_count",
            headers=headers,
            timeout=10,
        )
        existing_res.raise_for_status()
        existing = existing_res.json()

        if existing:
            row = existing[0]
            requests.patch(
                f"{SUPABASE_URL}/rest/v1/daily_usage?id=eq.{row['id']}",
                headers=headers,
                json={"upload_count": (row.get("upload_count") or 0) + 1},
                timeout=10,
            )
        else:
            requests.post(
                f"{SUPABASE_URL}/rest/v1/daily_usage",
                headers=headers,
                json={
                    "user_id": user_id,
                    "usage_date": today,
                    "upload_count": 1,
                },
                timeout=10,
            )
    except Exception as e:
        print("SUPABASE LOG ERROR:", str(e))


def get_daily_limit_for_tier(tier: str) -> int:
    tier = (tier or "free").lower()
    if tier == "premium":
        return 15
    if tier == "pro":
        return 50
    return 5


def get_profile_tier(user_id: str) -> str:
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY or not user_id:
        return "free"

    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }

    try:
        profile_res = requests.get(
            f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}&select=tier",
            headers=headers,
            timeout=10,
        )
        profile_res.raise_for_status()
        profile_rows = profile_res.json()
        return (profile_rows[0].get("tier") or "free").lower() if profile_rows else "free"
    except Exception as e:
        print("GET PROFILE TIER ERROR:", str(e))
        return "free"


def get_max_document_size_for_tier(tier: str) -> int:
    tier = (tier or "free").lower()
    if tier == "premium":
        return 15 * 1024 * 1024
    if tier == "pro":
        return 30 * 1024 * 1024
    return 5 * 1024 * 1024


def get_max_image_size_for_tier(tier: str) -> int:
    tier = (tier or "free").lower()
    if tier == "premium":
        return 8 * 1024 * 1024
    if tier == "pro":
        return 15 * 1024 * 1024
    return 3 * 1024 * 1024


def get_allowed_mock_difficulties_for_tier(tier: str) -> list[str]:
    tier = (tier or "free").lower()
    if tier == "premium":
        return ["easy", "medium"]
    if tier == "pro":
        return ["easy", "medium", "hard"]
    return ["easy"]

def check_upload_limit_in_supabase(user_id: str):
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY or not user_id:
        return True, ""

    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }

    today = datetime.now(timezone.utc).date().isoformat()

    try:
        profile_res = requests.get(
            f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}&select=tier",
            headers=headers,
            timeout=10,
        )
        profile_res.raise_for_status()
        profile_rows = profile_res.json()
        tier = profile_rows[0]["tier"] if profile_rows and profile_rows[0].get("tier") else "free"

        daily_limit = get_daily_limit_for_tier(tier)

        usage_res = requests.get(
            f"{SUPABASE_URL}/rest/v1/daily_usage?user_id=eq.{user_id}&usage_date=eq.{today}&select=upload_count",
            headers=headers,
            timeout=10,
        )
        usage_res.raise_for_status()
        usage_rows = usage_res.json()

        current_count = usage_rows[0]["upload_count"] if usage_rows and usage_rows[0].get("upload_count") is not None else 0

        if current_count >= daily_limit:
            return False, f"Daily limit reached. Your {tier} plan allows {daily_limit} uploads per day."

        return True, ""

    except Exception as e:
        print("SUPABASE LIMIT CHECK ERROR:", str(e))
        return False, "Could not verify upload limit. Please try again."

def log_chat_to_supabase(user_id: str):
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY or not user_id:
        return

    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }

    today = datetime.now(timezone.utc).date().isoformat()

    try:
        existing_res = requests.get(
            f"{SUPABASE_URL}/rest/v1/daily_chat_usage?user_id=eq.{user_id}&usage_date=eq.{today}&select=id,chat_count",
            headers=headers,
            timeout=10,
        )
        existing_res.raise_for_status()
        existing = existing_res.json()

        if existing:
            row = existing[0]
            requests.patch(
                f"{SUPABASE_URL}/rest/v1/daily_chat_usage?id=eq.{row['id']}",
                headers=headers,
                json={"chat_count": (row.get("chat_count") or 0) + 1},
                timeout=10,
            )
        else:
            requests.post(
                f"{SUPABASE_URL}/rest/v1/daily_chat_usage",
                headers=headers,
                json={
                    "user_id": user_id,
                    "usage_date": today,
                    "chat_count": 1,
                },
                timeout=10,
            )
    except Exception as e:
        print("SUPABASE CHAT LOG ERROR:", str(e))


def get_daily_chat_limit_for_tier(tier: str) -> int:
    tier = (tier or "free").lower()
    if tier == "premium":
        return 100
    if tier == "pro":
        return 500
    return 15


def check_chat_limit_in_supabase(user_id: str):
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY or not user_id:
        return True, ""

    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }

    today = datetime.now(timezone.utc).date().isoformat()

    try:
        profile_res = requests.get(
            f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}&select=tier",
            headers=headers,
            timeout=10,
        )
        profile_res.raise_for_status()
        profile_rows = profile_res.json()
        tier = profile_rows[0]["tier"] if profile_rows and profile_rows[0].get("tier") else "free"

        daily_limit = get_daily_chat_limit_for_tier(tier)

        usage_res = requests.get(
            f"{SUPABASE_URL}/rest/v1/daily_chat_usage?user_id=eq.{user_id}&usage_date=eq.{today}&select=chat_count",
            headers=headers,
            timeout=10,
        )
        usage_res.raise_for_status()
        usage_rows = usage_res.json()

        current_count = usage_rows[0]["chat_count"] if usage_rows and usage_rows[0].get("chat_count") is not None else 0

        if current_count >= daily_limit:
            return False, f"Daily chat limit reached. Your {tier} plan allows {daily_limit} chats per day."

        return True, ""

    except Exception as e:
        print("SUPABASE CHAT LIMIT CHECK ERROR:", str(e))
        return False, "Could not verify chat limit. Please try again."


def log_audio_to_supabase(user_id: str):
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY or not user_id:
        return

    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }

    today = datetime.now(timezone.utc).date().isoformat()

    try:
        existing_res = requests.get(
            f"{SUPABASE_URL}/rest/v1/daily_audio_usage?user_id=eq.{user_id}&usage_date=eq.{today}&select=id,audio_count",
            headers=headers,
            timeout=10,
        )
        existing_res.raise_for_status()
        existing = existing_res.json()

        if existing:
            row = existing[0]
            requests.patch(
                f"{SUPABASE_URL}/rest/v1/daily_audio_usage?id=eq.{row['id']}",
                headers=headers,
                json={"audio_count": (row.get("audio_count") or 0) + 1},
                timeout=10,
            )
        else:
            requests.post(
                f"{SUPABASE_URL}/rest/v1/daily_audio_usage",
                headers=headers,
                json={
                    "user_id": user_id,
                    "usage_date": today,
                    "audio_count": 1,
                },
                timeout=10,
            )
    except Exception as e:
        print("SUPABASE AUDIO LOG ERROR:", str(e))


def get_daily_audio_limit_for_tier(tier: str) -> int:
    tier = (tier or "free").lower()
    if tier == "premium":
        return 30
    if tier == "pro":
        return 100
    return 3


def check_audio_limit_in_supabase(user_id: str):
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY or not user_id:
        return True, ""

    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }

    today = datetime.now(timezone.utc).date().isoformat()

    try:
        profile_res = requests.get(
            f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}&select=tier",
            headers=headers,
            timeout=10,
        )
        profile_res.raise_for_status()
        profile_rows = profile_res.json()
        tier = profile_rows[0]["tier"] if profile_rows and profile_rows[0].get("tier") else "free"

        daily_limit = get_daily_audio_limit_for_tier(tier)

        usage_res = requests.get(
            f"{SUPABASE_URL}/rest/v1/daily_audio_usage?user_id=eq.{user_id}&usage_date=eq.{today}&select=audio_count",
            headers=headers,
            timeout=10,
        )
        usage_res.raise_for_status()
        usage_rows = usage_res.json()

        current_count = usage_rows[0]["audio_count"] if usage_rows and usage_rows[0].get("audio_count") is not None else 0

        if current_count >= daily_limit:
            return False, f"Daily audio limit reached. Your {tier} plan allows {daily_limit} listens per day."

        return True, ""

    except Exception as e:
        print("SUPABASE AUDIO LIMIT CHECK ERROR:", str(e))
        return False, "Could not verify audio limit. Please try again."

def get_supabase_headers():
    return {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }

def normalize_email(email: str) -> str:
    return (email or "").strip().lower()


def get_supabase_admin_headers():
    return {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
    }


def get_supabase_auth_headers(access_token: str):
    return {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {access_token}",
    }


def get_user_from_access_token(access_token: str) -> Optional[dict]:
    if not SUPABASE_URL or not SUPABASE_ANON_KEY or not access_token:
        return None

    try:
        res = requests.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers=get_supabase_auth_headers(access_token),
            timeout=10,
        )
        res.raise_for_status()
        return res.json()
    except Exception as e:
        print("GET USER FROM TOKEN ERROR:", str(e))
        return None


def retained_identity_exists(email: str) -> bool:
    normalized = normalize_email(email)
    if not normalized:
        return False

    try:
        res = requests.get(
            f"{SUPABASE_URL}/rest/v1/retained_identities?normalized_email=eq.{normalized}&select=id",
            headers=get_supabase_admin_headers(),
            timeout=10,
        )
        res.raise_for_status()
        rows = res.json()
        return len(rows) > 0
    except Exception as e:
        print("RETAINED IDENTITY CHECK ERROR:", str(e))
        return False


def retain_identity(email: str, reason: str = "trial_used"):
    normalized = normalize_email(email)
    if not normalized:
        return

    try:
        requests.post(
            f"{SUPABASE_URL}/rest/v1/retained_identities",
            headers={
                **get_supabase_admin_headers(),
                "Prefer": "resolution=merge-duplicates,return=minimal",
            },
            json={
                "email": email.strip(),
                "normalized_email": normalized,
                "reason": reason,
            },
            timeout=10,
        ).raise_for_status()
    except Exception as e:
        print("RETAIN IDENTITY ERROR:", str(e))


def delete_supabase_auth_user(user_id: str):
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY or not user_id:
        raise ValueError("Missing Supabase admin config or user id")

    res = requests.delete(
        f"{SUPABASE_URL}/auth/v1/admin/users/{user_id}",
        headers={
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        },
        timeout=10,
    )
    res.raise_for_status()


def unix_to_iso(ts):
    if not ts:
        return None
    return datetime.fromtimestamp(ts, tz=timezone.utc).isoformat()


def get_profile_by_user_id(user_id: str):
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY or not user_id:
        return None

    try:
        res = requests.get(
            f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}&select=*",
            headers=get_supabase_headers(),
            timeout=10,
        )
        res.raise_for_status()
        rows = res.json()
        return rows[0] if rows else None
    except Exception as e:
        print("GET PROFILE ERROR:", str(e))
        return None


def update_profile_subscription_fields(user_id: str, payload: dict):
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY or not user_id:
        return

    try:
        requests.patch(
            f"{SUPABASE_URL}/rest/v1/profiles?id=eq.{user_id}",
            headers=get_supabase_headers(),
            json=payload,
            timeout=10,
        ).raise_for_status()
    except Exception as e:
        print("UPDATE PROFILE SUBSCRIPTION ERROR:", str(e))


def get_or_create_stripe_customer(user_id: str, email: str | None = None):
    profile = get_profile_by_user_id(user_id) or {}

    existing_customer_id = profile.get("stripe_customer_id")
    if existing_customer_id:
        return existing_customer_id

    customer = stripe.Customer.create(
        email=email,
        metadata={"user_id": user_id}
    )

    update_profile_subscription_fields(
        user_id,
        {"stripe_customer_id": customer.id}
    )

    return customer.id

def apply_subscription_to_profile(user_id: str, subscription):
    status = subscription.get("status", "free")
    cancel_at_period_end = bool(subscription.get("cancel_at_period_end", False))

    trial_end_ts = subscription.get("trial_end")
    current_period_end_ts = subscription.get("current_period_end")
    cancel_at_ts = subscription.get("cancel_at")

    trial_end = unix_to_iso(trial_end_ts)

    plan_end_ts = current_period_end_ts or cancel_at_ts or trial_end_ts
    plan_end = unix_to_iso(plan_end_ts)

    tier = "free"
    active_statuses = {"trialing", "active"}

    if status in active_statuses:
        items = subscription.get("items", {}).get("data", [])
        price_id = None

        if items and items[0].get("price"):
            price_id = items[0]["price"].get("id")

        if price_id == STRIPE_PRICE_ID_PRO:
            tier = "pro"
        elif price_id == STRIPE_PRICE_ID_PREMIUM:
            tier = "premium"

    update_profile_subscription_fields(
        user_id,
        {
            "tier": tier,
            "subscription_status": status,
            "trial_ends_at": trial_end,
            "plan_ends_at": plan_end,
            "stripe_subscription_id": subscription.get("id"),
            "subscription_cancel_at_period_end": cancel_at_period_end,
        },
    )


def downgrade_profile_to_free(user_id: str):
    update_profile_subscription_fields(
        user_id,
        {
            "tier": "free",
            "subscription_status": "free",
            "trial_ends_at": None,
            "plan_ends_at": None,
            "stripe_subscription_id": None,
            "subscription_cancel_at_period_end": False,
        },
    )



def get_client() -> AzureOpenAI:
    endpoint = os.getenv("AZURE_OPENAI_ENDPOINT", "")
    api_key = os.getenv("AZURE_OPENAI_KEY", "")
    api_version = os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-15-preview")

    if not endpoint or not api_key:
        raise ValueError("Azure OpenAI environment variables are missing.")

    return AzureOpenAI(
        azure_endpoint=endpoint,
        api_key=api_key,
        api_version=api_version,
    )

EMBEDDING_MODEL = "text-embedding-3-small"
embedding_cache = {}


def get_embedding(text: str):
    text = text.strip()
    if not text:
        return []

    cache_key = text[:2000]

    if cache_key in embedding_cache:
        return embedding_cache[cache_key]

    client = get_client()
    response = client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=text
    )

    embedding = response.data[0].embedding
    embedding_cache[cache_key] = embedding
    return embedding

def cosine_similarity(a, b):
    dot = sum(x*y for x,y in zip(a,b))
    mag_a = math.sqrt(sum(x*x for x in a))
    mag_b = math.sqrt(sum(x*x for x in b))

    if mag_a == 0 or mag_b == 0:
        return 0

    return dot/(mag_a*mag_b)

def normalize_query(text: str) -> str:
    text = text.strip().lower()
    return text

def is_question_related_to_document(question, document_text):
    question = normalize_query(question)
    question_embedding = get_embedding(question)

    # ⚡ use only first chunk instead of full doc
    doc_sample = document_text[:1500]
    doc_embedding = get_embedding(doc_sample)
    score = cosine_similarity(question_embedding, doc_embedding)
    return score, question_embedding


def extract_text(uploaded_file: UploadFile, file_bytes: bytes) -> str:
    name = uploaded_file.filename.lower()

    if name.endswith((".txt", ".md", ".sas", ".log", ".csv")):
        return file_bytes.decode("utf-8", errors="ignore")

    if name.endswith(".docx"):
        doc = Document(io.BytesIO(file_bytes))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n".join(paragraphs)


    if name.endswith(".pdf"):
        if PdfReader is None:
            return "PDF support requires pypdf."

        reader = PdfReader(io.BytesIO(file_bytes))
        pages = []
        for page in reader.pages:
            pages.append(page.extract_text() or "")

        text = "\n".join(pages)

        if text.strip():
            return text

        return extract_text_from_image(file_bytes)

    if name.endswith((".png", ".jpg", ".jpeg")):
        return extract_text_from_image(file_bytes)

    return "Unsupported file type."


def extract_youtube_video_id(url: str) -> str:
    parsed = urlparse(url)
    hostname = parsed.hostname or ""

    if hostname in ["www.youtube.com", "youtube.com", "m.youtube.com"]:
        query = parse_qs(parsed.query)
        return query.get("v", [""])[0]

    if hostname == "youtu.be":
        return parsed.path.lstrip("/")

    return ""


def get_youtube_transcript(url: str) -> str:
    video_id = extract_youtube_video_id(url)
    if not video_id:
        raise ValueError("Invalid YouTube URL.")

    try:
        ytt_api = YouTubeTranscriptApi()
        transcript_list = ytt_api.list(video_id)

        try:
            transcript = transcript_list.find_transcript(
                ["en", "hi", "mr", "te", "gu", "fr"]
            )
        except Exception:
            transcript = transcript_list.find_generated_transcript(
                ["hi", "mr", "te", "gu", "fr", "en"]
            )

        data = transcript.fetch()
        text_parts = []

        for item in data:
            if hasattr(item, "text"):
                text_parts.append(item.text)
            elif isinstance(item, dict):
                text_parts.append(item.get("text", ""))

        final_text = " ".join(part.strip() for part in text_parts if part and part.strip())

        if not final_text:
            raise ValueError("Transcript is empty.")

        return final_text[:12000]

    except Exception as e:
        raise ValueError(f"Unable to fetch YouTube transcript: {str(e)}")



def get_website_text(url: str) -> str:
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/124.0.0.0 Safari/537.36"
        )
    }

    try:
        response = requests.get(
            url,
            headers=headers,
            timeout=(5, 12),
            allow_redirects=True
        )
        response.raise_for_status()

        content_type = response.headers.get("Content-Type", "").lower()
        if "text/html" not in content_type and "application/xhtml+xml" not in content_type:
            raise ValueError("URL does not contain a readable HTML page.")

        soup = BeautifulSoup(response.text, "html.parser")

        for tag in soup(["script", "style", "noscript", "header", "footer", "svg"]):
            tag.decompose()

        text = soup.get_text(separator=" ", strip=True)
        text = " ".join(text.split())

        if not text:
            raise ValueError("No readable text found on the webpage.")

        return text[:12000]

    except requests.exceptions.Timeout:
        raise ValueError("Website request timed out.")
    except requests.exceptions.RequestException as e:
        raise ValueError(f"Unable to fetch website: {str(e)}")
    except Exception as e:
        raise ValueError(f"Unable to extract website text: {str(e)}")


def extract_text_from_image(file_bytes: bytes) -> str:
    endpoint = os.getenv("AZURE_DOC_INTELLIGENCE_ENDPOINT")
    key = os.getenv("AZURE_DOC_INTELLIGENCE_KEY")

    client = DocumentIntelligenceClient(
        endpoint=endpoint,
        credential=AzureKeyCredential(key)
    )

    poller = client.begin_analyze_document(
        "prebuilt-layout",
        file_bytes
    )

    result = poller.result()

    text = []
    for page in result.pages:
        for line in page.lines:
            text.append(line.content)

    final_text = "\n".join(text)
    
    if not final_text.strip():
        print("OCR failed → switching to GPT Vision")
    
        # fallback to vision
        import base64
        image_base64 = base64.b64encode(file_bytes).decode("utf-8")
    
        client = get_client()
    
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Extract and explain key information from this image clearly."},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_base64}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=400,
        )
    
        return response.choices[0].message.content
    
    return final_text


@app.post("/billing/create-checkout-session")
async def create_checkout_session(request: Request):
    if request.headers.get("x-api-key") != os.getenv("APP_API_KEY"):
        raise HTTPException(status_code=401, detail="Unauthorized")

    body = await request.json()
    user_id = body.get("user_id", "").strip()
    email = body.get("email", "").strip()
    plan = body.get("plan", "premium").strip().lower()

    if not user_id:
        raise HTTPException(status_code=400, detail="Missing user_id")

    if not STRIPE_SECRET_KEY or not STRIPE_PRICE_ID_PREMIUM or not STRIPE_PRICE_ID_PRO:
        raise HTTPException(status_code=500, detail="Stripe is not configured")

    if plan not in {"premium", "pro"}:
        raise HTTPException(status_code=400, detail="Invalid plan")

    customer_id = get_or_create_stripe_customer(user_id, email)

    selected_price_id = STRIPE_PRICE_ID_PREMIUM if plan == "premium" else STRIPE_PRICE_ID_PRO


    subscription_data = {
        "metadata": {
            "user_id": user_id,
            "plan": plan,
        },
    }

    if plan == "premium":
        already_used_trial = retained_identity_exists(email) if email else False
        if not already_used_trial:
            subscription_data["trial_period_days"] = 7




    session = stripe.checkout.Session.create(
        mode="subscription",
        customer=customer_id,
        line_items=[
            {
                "price": selected_price_id,
                "quantity": 1,
            }
        ],
        subscription_data=subscription_data,
        success_url=f"{FRONTEND_BASE_URL}?billing=success",
        cancel_url=f"{FRONTEND_BASE_URL}?billing=cancel",
        allow_promotion_codes=True,
    )

    return {"url": session.url}




@app.post("/billing/create-portal-session")
async def create_portal_session(request: Request):
    if request.headers.get("x-api-key") != os.getenv("APP_API_KEY"):
        raise HTTPException(status_code=401, detail="Unauthorized")

    body = await request.json()
    user_id = body.get("user_id", "").strip()
    action = body.get("action", "").strip().lower()

    if not user_id:
        raise HTTPException(status_code=400, detail="Missing user_id")

    profile = get_profile_by_user_id(user_id) or {}
    customer_id = profile.get("stripe_customer_id")
    subscription_id = profile.get("stripe_subscription_id")

    if not customer_id:
        raise HTTPException(status_code=400, detail="No Stripe customer found")

    if action == "cancel":
        if not subscription_id:
            raise HTTPException(status_code=400, detail="No active subscription found")

        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=FRONTEND_BASE_URL,
            flow_data={
                "type": "subscription_cancel",
                "subscription_cancel": {
                    "subscription": subscription_id,
                },
                "after_completion": {
                    "type": "redirect",
                    "redirect": {
                        "return_url": f"{FRONTEND_BASE_URL}?billing=cancelled"
                    }
                }
            },
        )
    else:
        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=FRONTEND_BASE_URL,
        )

    return {"url": session.url}




@app.post("/billing/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload,
            sig_header,
            STRIPE_WEBHOOK_SECRET
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook error: {str(e)}")

    event_type = event["type"]
    obj = event["data"]["object"]

    try:
        if event_type == "checkout.session.completed":
            user_id = (
                obj.get("metadata", {}).get("user_id")
                or obj.get("subscription_details", {}).get("metadata", {}).get("user_id")
            )
            customer_id = obj.get("customer")

            if user_id and customer_id:
                update_profile_subscription_fields(
                    user_id,
                    {"stripe_customer_id": customer_id}
                )

        elif event_type in ["customer.subscription.created", "customer.subscription.updated"]:
            subscription = obj
            user_id = subscription.get("metadata", {}).get("user_id")

            if not user_id:
                customer_id = subscription.get("customer")
                if customer_id:
                    res = requests.get(
                        f"{SUPABASE_URL}/rest/v1/profiles?stripe_customer_id=eq.{customer_id}&select=id",
                        headers=get_supabase_headers(),
                        timeout=10,
                    )
                    res.raise_for_status()
                    rows = res.json()
                    user_id = rows[0]["id"] if rows else None

            if user_id:
                apply_subscription_to_profile(user_id, subscription)

        elif event_type == "customer.subscription.deleted":
            subscription = obj
            user_id = subscription.get("metadata", {}).get("user_id")

            if not user_id:
                customer_id = subscription.get("customer")
                if customer_id:
                    res = requests.get(
                        f"{SUPABASE_URL}/rest/v1/profiles?stripe_customer_id=eq.{customer_id}&select=id",
                        headers=get_supabase_headers(),
                        timeout=10,
                    )
                    res.raise_for_status()
                    rows = res.json()
                    user_id = rows[0]["id"] if rows else None

            if user_id:
                downgrade_profile_to_free(user_id)

    except Exception as e:
        print("STRIPE WEBHOOK HANDLER ERROR:", str(e))
        raise HTTPException(status_code=500, detail="Webhook handler failed")

    return {"received": True}


@app.post("/account/delete")
async def delete_account(request: Request):
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing access token")

    access_token = auth_header.replace("Bearer ", "", 1).strip()
    auth_user = get_user_from_access_token(access_token)

    if not auth_user:
        raise HTTPException(status_code=401, detail="Invalid access token")

    user_id = auth_user.get("id")
    email = auth_user.get("email", "").strip()

    if not user_id:
        raise HTTPException(status_code=400, detail="User id not found")

    profile = get_profile_by_user_id(user_id) or {}
    subscription_status = (profile.get("subscription_status") or "").lower()

    has_used_trial = bool(
        profile.get("trial_ends_at")
        or profile.get("stripe_customer_id")
        or subscription_status == "trialing"
        or subscription_status == "active"
    )

    if email and has_used_trial:
        retain_identity(email=email, reason="trial_used")

    try:
        delete_supabase_auth_user(user_id)
    except Exception as e:
        print("DELETE ACCOUNT ERROR:", str(e))
        raise HTTPException(status_code=500, detail="Failed to delete account")

    return {"success": True}

@app.get("/")
def root():
    return {"message": "GrindX AI backend is running"}


@app.post("/summarize")
async def summarize(
    file: UploadFile = File(...),
    user_id: str = Form("")
):

    if user_id:
        allowed, message = check_upload_limit_in_supabase(user_id)
        if not allowed:
            return {
                "filename": file.filename,
                "summary": message,
                "document_text": "",
            }


    file_bytes = await file.read()

    tier = get_profile_tier(user_id) if user_id else "free"
    max_size = get_max_document_size_for_tier(tier)

    if len(file_bytes) > max_size:
        return {
            "filename": file.filename,
            "summary": f"File too large. Your {tier} plan allows up to {max_size // (1024 * 1024)}MB documents.",
            "document_text": "",
        }

    text = extract_text(file, file_bytes)



    client = get_client()
    deployment_name = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4o-mini")
    

    response = client.chat.completions.create(
        model=deployment_name,
        messages=[
            {
                "role": "system",
                "content": "You are a document intelligence assistant. Summarise clearly using short paragraphs and bullet points."
            },
            {
                "role": "user",
                "content": f"Summarise this document:\n\n{text[:12000]}"
            }
        ],
        temperature=0.2,
    )

    summary = response.choices[0].message.content or "No summary returned."
    summary = "\n".join(line.strip() for line in summary.splitlines() if line.strip())


    if user_id:
        log_usage_to_supabase(
            user_id=user_id,
            source_type="file",
            file_name=file.filename
        )

    return {
        "filename": file.filename,
        "summary": summary,
        "document_text": text[:15000],
    }



from fastapi import Form
@app.post("/summarize-video")
async def summarize_video(
    video_url: str = Form(...),
    user_id: str = Form("")
):
    try:

        if user_id:
            allowed, message = check_upload_limit_in_supabase(user_id)
            if not allowed:
                return {
                    "filename": video_url,
                    "summary": message,
                    "document_text": "",
                }


        transcript_text = get_youtube_transcript(video_url)

        if not transcript_text or transcript_text.strip() == "":
            return {
                "filename": video_url,
                "summary": "No transcript could be extracted from this video.",
                "document_text": "",
            }

        client = get_client()
        deployment_name = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4o-mini")

        response = client.chat.completions.create(
            model=deployment_name,
            messages=[
                {
                    "role": "system",
                    "content": "You are a video transcript intelligence assistant. Summarise clearly using short paragraphs and bullet points."
                },
                {
                    "role": "user",
                    "content": f"Summarise this video transcript:\n\n{transcript_text[:12000]}"
                }
            ],
            temperature=0.2,
        )

        summary = response.choices[0].message.content or "No summary returned."
        summary = "\n".join(line.strip() for line in summary.splitlines() if line.strip())

        if user_id:
            log_usage_to_supabase(user_id=user_id, source_type="url", file_name=video_url)

        return {
            "filename": video_url,
            "summary": summary,
            "document_text": transcript_text[:15000],
        }

    except Exception as e:
        print("VIDEO ERROR:", str(e))
        return {
            "filename": video_url,
            "summary": f"Video analysis failed: {str(e)}",
            "document_text": "",
        }


from fastapi import Form

@app.post("/summarize-website")
async def summarize_website(
    website_url: str = Form(...),
    user_id: str = Form("")
):
    try:

        if user_id:
            allowed, message = check_upload_limit_in_supabase(user_id)
            if not allowed:
                return {
                    "filename": website_url,
                    "summary": message,
                    "document_text": "",
                }


        website_text = get_website_text(website_url)

        client = get_client()
        deployment_name = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4o-mini")

        response = client.chat.completions.create(
            model=deployment_name,
            messages=[
                {
                    "role": "system",
                    "content": "You are a website content intelligence assistant. Summarise clearly using short paragraphs and bullet points."
                },
                {
                    "role": "user",
                    "content": f"Summarise this webpage content:\n\n{website_text[:12000]}"
                }
            ],
            temperature=0.2,
        )

        summary = response.choices[0].message.content or "No summary returned."
        summary = "\n".join(line.strip() for line in summary.splitlines() if line.strip())

        if user_id:
            log_usage_to_supabase(user_id=user_id, source_type="url", file_name=website_url)

        return {
            "filename": website_url,
            "summary": summary,
            "document_text": website_text[:15000],
        }

    except Exception as e:
        print("WEBSITE ERROR:", str(e))
        return {
            "filename": website_url,
            "summary": f"Website analysis failed: {str(e)}",
            "document_text": "",
        }



def chunk_text(text: str, chunk_size: int = 800) -> list[str]:
    text = text.strip()
    if not text:
        return []

    paragraphs = [p.strip() for p in text.split("\n") if p.strip()]

    chunks = []
    current_chunk = ""

    for para in paragraphs:
        if len(current_chunk) + len(para) + 1 <= chunk_size:
            current_chunk += ("\n" if current_chunk else "") + para
        else:
            if current_chunk:
                chunks.append(current_chunk)
            current_chunk = para

    if current_chunk:
        chunks.append(current_chunk)

    return chunks


def get_top_chunks(document_text: str, question_embedding, top_k: int = 3):

    chunks = chunk_text(document_text)

    if not chunks:
        return [(1.0, document_text[:3000])]

    scored = []

    for chunk in chunks:
        chunk_embedding = get_embedding(chunk[:1000])
        score = cosine_similarity(question_embedding, chunk_embedding)
        scored.append((score, chunk))

    scored.sort(key=lambda x: x[0], reverse=True)

    # ✅ RETURN WITH SCORES
    return scored[:top_k]



def get_voice_by_language(language: str):
    mapping = {
        "english": "en-AU-NatashaNeural",
        "hindi": "hi-IN-SwaraNeural",
        "french": "fr-FR-DeniseNeural",
        "german": "de-DE-KatjaNeural",
        "spanish": "es-ES-ElviraNeural",
        "arabic": "ar-SA-ZariyahNeural",
        "japanese": "ja-JP-NanamiNeural",
        "chinese": "zh-CN-XiaoxiaoNeural",

    }
    return mapping.get(language.lower(), "en-AU-NatashaNeural")


# 🔹 CLEAN TEXT (FIX *** ISSUE)
def clean_text_for_speech(text: str) -> str:
    text = re.sub(r"\*\*|\*|__", "", text)
    text = re.sub(r"_", "", text)
    text = re.sub(r"`", "", text)
    text = re.sub(r"[#>-]", "", text)
    text = re.sub(r"\n+", " ", text)
    return text.strip()


@app.post("/speak")
async def speak(
    text: str = Form(...),
    language: str = Form("english"),
    user_id: str = Form("")
):
    try:
        if user_id:
            allowed, message = check_audio_limit_in_supabase(user_id)
            if not allowed:
                return JSONResponse(
                    status_code=429,
                    content={"error": message}
                )

        text = clean_text_for_speech(text)
        text = text[:1500]

        if not text:
            return JSONResponse(
                status_code=400,
                content={"error": "No text available for speech."}
            )

        speech_key = os.getenv("AZURE_SPEECH_KEY")
        speech_region = os.getenv("AZURE_SPEECH_REGION")

        speech_config = speechsdk.SpeechConfig(
            subscription=speech_key,
            region=speech_region
        )

        voice = get_voice_by_language(language)
        speech_config.speech_synthesis_voice_name = voice

        synthesizer = speechsdk.SpeechSynthesizer(
            speech_config=speech_config,
            audio_config=None
        )

        result = synthesizer.speak_text_async(text).get()

        if result.reason != speechsdk.ResultReason.SynthesizingAudioCompleted:
            print("Speech error:", result.reason)
            return JSONResponse(
                status_code=500,
                content={"error": "Speech failed"}
            )

        if user_id:
            log_audio_to_supabase(user_id)

        return Response(
            content=result.audio_data,
            media_type="audio/wav"
        )

    except Exception as e:
        print("SPEAK ERROR:", str(e))
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )



@app.post("/translate-and-speak")
async def translate_and_speak(
    text: str = Form(...),
    language: str = Form(...)
):
    try:
        # ✅ CLEAN FIRST (IMPORTANT)
        text = clean_text_for_speech(text)

        # 🌍 LANGUAGE MAP
        lang_map = {
            "english": "en",
            "hindi": "hi",
            "french": "fr",
            "german": "de",
            "spanish": "es",
            "arabic": "ar",
            "japanese": "ja",
            "chinese": "zh-Hans",
        }


        target_lang = lang_map.get(language.lower(), "en")
        
        # ✅ FORCE SAFE LANG FOR SPEECH
        speech_lang = target_lang
        
        if target_lang in ["gu", "pa"]:
            speech_lang = "hi"   # fallback for speech only


        print("LANG:", language)
        print("TARGET:", target_lang)
        print("TEXT:", text[:100])


        translated_text = text
        print("TRANSLATED:", translated_text[:100])


        # 🔹 TRANSLATE IF NOT ENGLISH
        if target_lang != "en":
            endpoint = os.getenv("AZURE_TRANSLATOR_ENDPOINT")
            key = os.getenv("AZURE_TRANSLATOR_KEY")


            url = f"{endpoint}/translate?api-version=3.0&to={target_lang}"
            

            headers = {
                "Ocp-Apim-Subscription-Key": key,
                "Ocp-Apim-Subscription-Region": "australiaeast",   # ✅ ADD THIS
                "Content-Type": "application/json"
            }
            
            body = [{
                "text": text
            }]
            
            response = requests.post(url, headers=headers, json=body)
            
            if response.status_code != 200:
                print("TRANSLATION ERROR:", response.text)
                return {"error": "Translation failed"}
            
            translated_text = response.json()[0]["translations"][0]["text"]


        # 🔊 SPEECH CONFIG
        speech_config = speechsdk.SpeechConfig(
            subscription=os.getenv("AZURE_SPEECH_KEY"),
            region=os.getenv("AZURE_SPEECH_REGION"),
        )

        # 🔥 VOICE MAPPING (THIS FIXES "Speech failed")
        voice_map = {
            "en": "en-US-AriaNeural",
            "hi": "hi-IN-SwaraNeural",
            "mr": "hi-IN-SwaraNeural",   # fallback
            "gu": "hi-IN-SwaraNeural",
            "te": "te-IN-MohanNeural",
            "pa": "hi-IN-SwaraNeural",
            "fr": "fr-FR-DeniseNeural",
            "de": "de-DE-KatjaNeural",
        }

        speech_config.speech_synthesis_voice_name = voice_map.get(speech_lang, "en-US-AriaNeural")


        synthesizer = speechsdk.SpeechSynthesizer(
            speech_config=speech_config,
            audio_config=None
        )

        result = synthesizer.speak_text_async(translated_text).get()

        if result.reason != speechsdk.ResultReason.SynthesizingAudioCompleted:
            print("Speech error:", result.reason)
            return {"error": "Speech failed"}

        return Response(
            content=result.audio_data,
            media_type="audio/wav"
        )

    except Exception as e:
        print("ERROR:", str(e))
        return {"error": str(e)}


@app.post("/translate")
async def translate(
    text: str = Form(...),
    language: str = Form(...)
):
    try:
        lang_map = {
            "english": "en",
            "hindi": "hi",
            "french": "fr",
            "german": "de",
            "spanish": "es",
            "arabic": "ar",
            "japanese": "ja",
            "chinese": "zh-Hans",
        }

        target_lang = lang_map.get(language.lower(), "en")

        if target_lang == "en":
            return {"translated_text": text}

        endpoint = os.getenv("AZURE_TRANSLATOR_ENDPOINT")
        key = os.getenv("AZURE_TRANSLATOR_KEY")

        url = f"{endpoint}/translate?api-version=3.0&to={target_lang}"

        headers = {
            "Ocp-Apim-Subscription-Key": key,
            "Ocp-Apim-Subscription-Region": "australiaeast",
            "Content-Type": "application/json"
        }

        body = [{"text": text}]

        response = requests.post(
            url,
            headers=headers,
            json=body,
            timeout=5
        )

        data = response.json()

        if response.status_code != 200 or not data:
            print("TRANSLATION FAILED:", data)
            return {"translated_text": text}

        translated_text = data[0]["translations"][0]["text"]

        return {"translated_text": translated_text}

    except Exception as e:
        print("TRANSLATE ERROR:", str(e))
        return {"translated_text": text}


@app.post("/summarize-text")
async def summarize_text(
    text: str = Form(...),
    user_id: str = Form("")
):

    if user_id:
        allowed, message = check_upload_limit_in_supabase(user_id)
        if not allowed:
            return {
                "summary": message,
                "document_text": "",
            }

    if not text.strip():
        return {
            "summary": "No text provided.",
            "document_text": ""
        }

    client = get_client()
    deployment_name = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4o-mini")

    response = client.chat.completions.create(
        model=deployment_name,
        messages=[
            {
                "role": "system",
                "content": "Summarise clearly using short paragraphs and bullet points."
            },
            {
                "role": "user",
                "content": f"Summarise this:\n\n{text[:12000]}"
            }
        ],
        temperature=0.2,
    )

    summary = response.choices[0].message.content or "No summary returned."

    if user_id:
        log_usage_to_supabase(
            user_id=user_id,
            source_type="pasted_text",
            file_name="Pasted Text"
        )

    return {
        "summary": summary,
        "document_text": text[:15000],
    }



@app.post("/key-concepts")
async def key_concepts(text: str = Form(...)):
    client = get_client()

    response = client.chat.completions.create(
        model=os.getenv("AZURE_OPENAI_DEPLOYMENT"),
        messages=[
            {"role": "system", "content": "Extract key concepts clearly."},
            {
                "role": "user",
                "content": f"""
Extract key concepts from this content.

Format:
- Concept
- Short explanation

Text:
{text[:12000]}
"""
            }
        ],
        temperature=0.2,
    )

    return {"result": response.choices[0].message.content}


@app.post("/practice-questions")
async def practice_questions(text: str = Form(...)):
    client = get_client()

    response = client.chat.completions.create(
        model=os.getenv("AZURE_OPENAI_DEPLOYMENT"),
        messages=[
            {"role": "system", "content": "Generate practice questions."},
            {
                "role": "user",
                "content": f"""
Generate at least 10-15 practice questions from the following content.

Rules:
- Questions can be slightly beyond document but MUST stay relevant
- Include conceptual + application + scenario questions
- Do NOT limit to 5
- Use clear formatting

Content:

Text:
{text[:12000]}
"""
            }
        ],
        temperature=0.3,
    )

    return {"result": response.choices[0].message.content}

def validate_mock_blocks(raw_text: str) -> str:
    raw_text = raw_text.strip()
    if not raw_text:
        return ""

    # Normalize markdown/noisy formatting first
    cleaned = re.sub(r"\*\*|###|##|#", "", raw_text)
    cleaned = cleaned.replace("\r\n", "\n").replace("\r", "\n")

    # Normalize option prefixes like A. -> A)
    cleaned = re.sub(r"^([A-D])\.\s+", r"\1) ", cleaned, flags=re.MULTILINE)

    # Split by each Question: block instead of blank lines
    blocks = re.split(r"(?=^Question:\s*)", cleaned, flags=re.MULTILINE)

    valid_blocks = []

    for block in blocks:
        block = block.strip()
        if not block:
            continue

        lines = [line.strip() for line in block.splitlines() if line.strip()]
        if not lines:
            continue

        question_lines = [line for line in lines if line.lower().startswith("question:")]
        option_lines = [line for line in lines if re.match(r"^[A-D]\)\s+", line)]
        answer_lines = [line for line in lines if line.lower().startswith("correctoptiontext:")]
        explanation_lines = [line for line in lines if line.lower().startswith("explanation:")]

        if len(question_lines) != 1:
            continue
        if len(option_lines) != 4:
            continue
        if len(answer_lines) != 1:
            continue
        if len(explanation_lines) != 1:
            continue

        correct_option_text = answer_lines[0].split(":", 1)[1].strip()
        option_texts = [re.sub(r"^[A-D]\)\s+", "", line).strip() for line in option_lines]

        if correct_option_text not in option_texts:
            continue

        valid_blocks.append("\n".join([
            question_lines[0],
            *option_lines,
            answer_lines[0],
            explanation_lines[0],
        ]))

    return "\n\n".join(valid_blocks)


@app.post("/mock-test")
async def mock_test(
    text: str = Form(...),
    difficulty: str = Form("medium"),
    user_id: str = Form("")
):
    client = get_client()


    difficulty = (difficulty or "medium").strip().lower()
    if difficulty not in ["easy", "medium", "hard"]:
        difficulty = "medium"

    tier = get_profile_tier(user_id) if user_id else "free"
    allowed_difficulties = get_allowed_mock_difficulties_for_tier(tier)

    if difficulty not in allowed_difficulties:
        return {
            "result": "",
            "error": f"{difficulty.capitalize()} mock tests are not available on your {tier} plan."
        }

    difficulty_rules = {
        "easy": """
DIFFICULTY LEVEL: EASY

QUESTION STYLE RULES:
- Use very simple wording
- Focus on definition, identification, direct recall, and one-step understanding
- Avoid tricky distractors
- Avoid multi-step reasoning unless extremely simple
- For maths/calculations, use only one-step calculations
- Keep options clearly distinguishable
- Keep most questions directly answerable from the document wording

REQUIRED MIX:
- 70% direct recall / definition
- 20% simple understanding
- 10% very light application

DO NOT:
- Do not use inference-heavy questions
- Do not combine multiple concepts in one question
- Do not make distractors too close to the correct answer
""",
        "medium": """
DIFFICULTY LEVEL: MEDIUM

QUESTION STYLE RULES:
- Use standard classroom test wording
- Mix recall, understanding, and application
- Include moderate reasoning and concept connection
- For maths/calculations, allow one-step and some two-step problems
- Distractors should be plausible
- Questions should often require understanding, not only memory

REQUIRED MIX:
- 30% direct recall / definition
- 40% understanding / concept explanation
- 30% application / moderate reasoning

DO NOT:
- Do not make all questions direct copy-from-document
- Do not make all questions highly tricky
- Do not use very advanced inference in most questions
""",
        "hard": """
DIFFICULTY LEVEL: HARD

QUESTION STYLE RULES:
- Use deeper reasoning, scenario-based application, comparison, inference, and multi-step thinking
- Questions should test whether the student can apply the topic, not just recall it
- For maths/calculations, prefer multi-step problems where appropriate
- Distractors should be close, believable, and based on common mistakes
- Include questions that combine two related ideas from the document
- Include teacher-style extension questions that are still tightly related to the document topic

REQUIRED MIX:
- 15% direct recall / definition
- 35% understanding / comparison
- 50% application / inference / multi-step reasoning

DO NOT:
- Do not make the test mostly recall
- Do not make options obviously easy to eliminate
- Do not generate unrelated outside-topic questions
"""
    }

    difficulty_instruction = difficulty_rules[difficulty]

    response = client.chat.completions.create(
        model=os.getenv("AZURE_OPENAI_DEPLOYMENT"),
        messages=[
            {
                "role": "system",
                "content": """
You are a strict exam generator.

You MUST follow this EXACT format for EVERY question.

FORMAT:

Question: <question text>
A) <option>
B) <option>
C) <option>
D) <option>
CorrectOptionText: <exact correct option text>
Explanation: <short explanation>

NON-NEGOTIABLE RULES:
- EXACTLY 4 options only
- NO markdown
- NO bullets
- NO numbering
- Each question separated by ONE blank line
- Use exactly A) B) C) D) for options
- Do not use A. B. C. D.
- CorrectOptionText MUST exactly match one and only one of the 4 option texts
- The Explanation MUST support that same correct option text
- Never output a CorrectOptionText that does not appear exactly in A/B/C/D
- Never output an Explanation that conflicts with CorrectOptionText
- For maths, logic, science, or factual questions:
  - solve/check the answer first
  - then build 4 options
  - then set CorrectOptionText to the exact correct option text
  - then write an explanation consistent with that correct option
- Make wrong options plausible, but clearly wrong
- Do not repeat the same option values in different letters for the same question
- Do not use 'all of the above' or 'none of the above'

FINAL SELF-CHECK BEFORE OUTPUT EACH QUESTION:
1. Identify the correct option text
2. Confirm it appears under only one letter A/B/C/D
3. Confirm CorrectOptionText exactly matches that option text
4. Confirm the Explanation supports that same option text
5. If any mismatch exists, rewrite the question before outputting it

Generate questions based on document length:
- Small document -> 8 to 12 questions
- Medium document -> 15 to 20 questions
- Large document -> 20 to 25 questions

Prefer quality and correctness over quantity.
"""
            },
            {
                "role": "user",
                "content": f"""
Generate a mock test from this document.

Selected difficulty:
{difficulty.upper()}

Difficulty rules:
{difficulty_instruction}

Global rules:
- Do NOT generate unrelated general knowledge questions
- Keep all questions relevant to the uploaded document topic
- Match the selected difficulty consistently across the full test
- The difference between easy, medium, and hard must be clearly visible
- For general documents, generate topic-based comprehension, definition, understanding, application, and inference questions
- For calculation questions, verify the result before setting CorrectOptionText
- If unsure, prefer document-grounded questions over external ones

Text:
{text[:12000]}
"""
            }
        ],
        temperature=0.0,
    )

    raw = response.choices[0].message.content or ""

    cleaned = validate_mock_blocks(raw)

    # Fallback: if strict validation removes everything, return normalized raw blocks
    if not cleaned.strip():
        normalized = re.sub(r"\*\*|###|##|#", "", raw)
        normalized = normalized.replace("\r\n", "\n").replace("\r", "\n")
        normalized = re.sub(r"^([A-D])\.\s+", r"\1) ", normalized, flags=re.MULTILINE)
        cleaned = normalized.strip()

    print("MOCK OUTPUT:\n", cleaned[:2000])

    return {"result": cleaned}


@app.post("/vision-analyze")
async def vision_analyze(file: UploadFile = File(...)):
    try:
        file_bytes = await file.read()

        # 🔒 IMAGE SIZE PROTECTION (5MB)
        MAX_SIZE = 5 * 1024 * 1024
        if len(file_bytes) > MAX_SIZE:
            raise HTTPException(
                status_code=400,
                detail="Image too large (max 5MB)"
            )

        # convert to base64
        image_base64 = base64.b64encode(file_bytes).decode("utf-8")

        client = get_client()

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Identify the content in this image. Extract text if present and explain clearly in simple terms."
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{image_base64}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=400,
            temperature=0.2
        )

        result = response.choices[0].message.content

        return {
            "summary": result,
            "document_text": result
        }

    except Exception as e:
        print("VISION ERROR:", str(e))
        return {
            "summary": f"Vision analysis failed: {str(e)}",
            "document_text": ""
        }



@app.post("/ocr")
async def ocr(
    file: UploadFile = File(...),
    user_id: str = Form(""),
    source_type: str = Form("camera")
):
    try:

        if user_id:
            allowed, message = check_upload_limit_in_supabase(user_id)
            if not allowed:
                return {
                    "summary": message,
                    "document_text": "",
                }


        file_bytes = await file.read()

        tier = get_profile_tier(user_id) if user_id else "free"
        max_size = get_max_image_size_for_tier(tier)

        if len(file_bytes) > max_size:
            raise HTTPException(
                status_code=400,
                detail=f"Image too large. Your {tier} plan allows up to {max_size // (1024 * 1024)}MB images."
            )


        text = extract_text_from_image(file_bytes)

        if not text or not text.strip():
            return {
                "summary": "⚠️ No readable text found. Try clearer image.",
                "document_text": ""
            }

        if user_id:
            log_usage_to_supabase(
                user_id=user_id,
                source_type=source_type,
                file_name=file.filename or source_type
            )

        return {
            "summary": text,
            "document_text": text
        }

    except Exception as e:
        print("OCR ERROR:", str(e))
        return {
            "summary": f"OCR failed: {str(e)}",
            "document_text": ""
        }




@app.post("/ask")
async def ask(
    request: Request,
    question: str = Form(...),
    document_text: str = Form(""),
    chat_history: str = Form(""),
    user_id: str = Form("")
):

    # 🔐 SECURITY CHECK (ADD THIS HERE)
    if request.headers.get("x-api-key") != os.getenv("APP_API_KEY"):
        raise HTTPException(status_code=401, detail="Unauthorized")


    if user_id:
        allowed, message = check_chat_limit_in_supabase(user_id)
        if not allowed:
            return {
                "answer": message,
                "source_type": "none",
            }


    # ✅ CASUAL CHAT (PUT EXACTLY HERE)
    simple_phrases = ["thanks", "thank you", "ok", "cool", "great", "nice", "got it"]
    
    if question.strip().lower() in simple_phrases:
        if user_id:
            log_chat_to_supabase(user_id)


        return {
            "answer": f"{question.capitalize()} 😊",
            "source_type": "external"
        }


    # 🛑 INPUT LIMIT (ADD HERE)
    if len(question) > 500:
        raise HTTPException(status_code=400, detail="Question too long")


    if not document_text or not document_text.strip():
        # ✅ ALLOW GENERAL CHAT
        client = get_client()
    
        response = client.chat.completions.create(
            model=os.getenv("AZURE_OPENAI_DEPLOYMENT"),
            messages=[
                {"role": "system", "content": "You are a helpful study assistant. If document exists, answer based on it. Otherwise answer normally."},
                {"role": "user", "content": question}
            ],
            temperature=0.3,
        )
    
        return {
            "answer": response.choices[0].message.content,
            "source_type": "external"
        }




    client = get_client()
    deployment_name = os.getenv("AZURE_OPENAI_DEPLOYMENT", "gpt-4o-mini")

    print("FRONTEND KEY:", request.headers.get("x-api-key"))
    print("BACKEND KEY:", os.getenv("APP_API_KEY"))


    # 🔥 STEP 1: Check if question is related to document
    doc_relevance_score, question_embedding = is_question_related_to_document(question, document_text)
    
    print("DOC RELEVANCE:", doc_relevance_score)
    
    # ❌ If NOT related → STOP
    if doc_relevance_score < 0.05:
        return {
            "answer": "This question is not related to the uploaded document. Please ask something relevant to the document.",
            "source_type": "none"
        }

    top_chunks = get_top_chunks(document_text, question_embedding, top_k=3)
    
    relevant_context = [chunk for score, chunk in top_chunks]
    max_score = max([score for score, _ in top_chunks]) if top_chunks else 0

   
    print("SIMILARITY SCORE:", max_score)
    

    # ✅ LOW RELEVANCE CASE
    if max_score < 0.03:
    
        classification = client.chat.completions.create(
            model=deployment_name,
            messages=[
                {
                    "role": "system",
                    "content": """
    Classify this question into one of these categories:
    - related_but_not_in_doc
    - irrelevant
    
    Answer ONLY one of those exact labels.
    

    Use irrelevant when:
    - the question changes to a different topic
    - the question is casual/general chat
    - the question is about coding, software, holidays, celebrities, current events, or anything not clearly part of the document topic
    - the question is pasted junk text or random content not meaningfully tied to the document
    
    Be strict. If unsure, answer irrelevant.
    """
                },
                {
                    "role": "user",
                    "content": f"""
    Question:
    {question}
    
    Document excerpt:
    {document_text[:2000]}
    """
                }
            ],
            temperature=0
        )
    
        intent = classification.choices[0].message.content.strip().lower()
    
        print("INTENT:", intent)
    
        if "related_but_not_in_doc" in intent:
            source_type = "external"
        else:
            return {
                "answer": "This question is not related to the uploaded document. Please ask something relevant.",
                "source_type": "none"
            }    

    # ✅ DEFAULT (THIS WAS MISSING BEFORE)
    else:
        source_type = "document"



    # ✅ RESPONSE
    if source_type == "external":
    
        response = client.chat.completions.create(
            model=deployment_name,
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful study assistant. The question is related to the uploaded document topic, but the document may not contain the answer directly. Answer clearly and stay close to the document topic."
                },
                {
                    "role": "user",
                    "content": f"""
    Chat History:
    {chat_history}
    
    Current Question:
    {question}
    
    Answer clearly and stay relevant to the uploaded document topic.
    Do not drift into unrelated general knowledge.
    """
                },
            ],
            temperature=0.3,
        )
    
    else:
        context_text = "\n\n---\n\n".join(relevant_context)
    
        response = client.chat.completions.create(
            model=deployment_name,
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant. Use chat history and document context to answer follow-up questions correctly."
                },
                {
                    "role": "user",
                    "content": f"""
    Chat History:
    {chat_history}
    
    Document Context:
    {context_text}
    
    Current Question:
    {question}
    
    Answer naturally using the document:
    
    - Be clear and concise
    - Use document context properly
    - No strict format
    """
                },
            ],
            temperature=0.1,
            max_tokens=300,
        )


    answer = response.choices[0].message.content or "No answer returned."

    # ❌ REMOVE THIS LINE (IMPORTANT)
    # source_type = "document" if relevant_context else "external"

    print("----- REQUEST -----")
    print("QUESTION:", question)
    print("DOC SCORE:", doc_relevance_score)
    print("CHUNK SCORE:", max_score)
    print("SOURCE:", source_type)
    print("-------------------")


    if user_id:
        log_chat_to_supabase(user_id)


    return {
        "answer": answer,
        "source_type": source_type
    }
