SET SERVEROUTPUT ON;

DECLARE
    v_results SYS_REFCURSOR;
    v_status  VARCHAR2(20);
    v_message VARCHAR2(4000);

    v_student_id       VARCHAR2(50);
    v_course_id        VARCHAR2(50);
    v_enrolment_status VARCHAR2(20);
    v_updated_at       TIMESTAMP;
BEGIN
    get_active_enrolments(
        p_last_run_time => SYSTIMESTAMP - INTERVAL '1' DAY,
        p_results       => v_results,
        p_status        => v_status,
        p_message       => v_message
    );

    DBMS_OUTPUT.PUT_LINE('Status: ' || v_status);
    DBMS_OUTPUT.PUT_LINE('Message: ' || v_message);

    LOOP
        FETCH v_results
        INTO
            v_student_id,
            v_course_id,
            v_enrolment_status,
            v_updated_at;

        EXIT WHEN v_results%NOTFOUND;

        DBMS_OUTPUT.PUT_LINE(
            v_student_id || ' | ' ||
            v_course_id || ' | ' ||
            v_enrolment_status
        );
    END LOOP;

    CLOSE v_results;
END;
/