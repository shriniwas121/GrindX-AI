CREATE OR REPLACE PROCEDURE get_active_enrolments (
    p_last_run_time IN  TIMESTAMP,
    p_results       OUT SYS_REFCURSOR,
    p_status        OUT VARCHAR2,
    p_message       OUT VARCHAR2
)
AS
BEGIN
    OPEN p_results FOR
        SELECT
            student_id,
            course_id,
            enrolment_status,
            updated_at
        FROM student_enrolments
        WHERE enrolment_status = 'ACTIVE'
          AND updated_at >= p_last_run_time
        ORDER BY updated_at;

    p_status  := 'SUCCESS';
    p_message := 'Active enrolments retrieved successfully';

EXCEPTION
    WHEN OTHERS THEN
        p_status  := 'FAILED';
        p_message := SQLERRM;

        IF p_results%ISOPEN THEN
            CLOSE p_results;
        END IF;

        RAISE;
END get_active_enrolments;
/

/*

“For a university integration, I would create a PL/SQL stored procedure such as get_active_enrolments. The procedure would accept p_last_run_time IN TIMESTAMP, which represents the timestamp of the previous successful integration run.

Inside the procedure, I would use OPEN p_results FOR to execute a query that selects only the required columns, such as student_id, course_id, enrolment_status, and updated_at. I would filter the data using enrolment_status = 'ACTIVE' and updated_at >= p_last_run_time, so the integration retrieves only new or changed records instead of reading the full table every time.

I would return the rows through p_results OUT SYS_REFCURSOR, because a reference cursor allows the calling system to receive multiple records. I would also include p_status OUT VARCHAR2 and p_message OUT VARCHAR2 so the caller knows whether the procedure completed successfully.

For error handling, I would use an EXCEPTION block with WHEN OTHERS, capture the Oracle error using SQLERRM, and return a failed status and error message to the integration layer. This makes the procedure suitable for incremental extraction, monitoring, and troubleshooting.”


*/