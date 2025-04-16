-- Step1
CREATE SEQUENCE IF NOT EXISTS public.review_feedback_comments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE public.review_feedback_comments (
    id integer DEFAULT nextval('public.review_feedback_comments_id_seq'::regclass) NOT NULL,
    review_feedback_id integer NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);

-- constraint, index
ALTER TABLE ONLY public.review_feedback_comments
    ADD CONSTRAINT review_feedback_comments_pkey PRIMARY KEY (id);

CREATE INDEX idx_review_feedback_comments_review_feedback_id
    ON public.review_feedback_comments (review_feedback_id);

ALTER TABLE ONLY public.review_feedback_comments
    ADD CONSTRAINT review_feedback_comments_review_feedback_id_fkey
    FOREIGN KEY (review_feedback_id)
    REFERENCES public."ReviewFeedback"(id)
    ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE ONLY public.review_feedback_comments
    ADD CONSTRAINT review_feedback_comments_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public."User"(id)
    ON UPDATE CASCADE ON DELETE CASCADE;

-- grapnt
GRANT ALL ON SEQUENCE public.review_feedback_comments_id_seq TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.review_feedback_comments TO anon, authenticated, service_role;

-- Step2
INSERT INTO public.review_feedback_comments (
    id,
    review_feedback_id,
    user_id,
    content,
    created_at,
    updated_at
)
SELECT
    id,
    "reviewFeedbackId",
    "userId",
    content,
    "createdAt",
    "updatedAt"
FROM public."ReviewFeedbackComment";

-- Step 3
DROP TABLE public."ReviewFeedbackComment" CASCADE;
DROP SEQUENCE public."ReviewFeedbackComment_id_seq";

-- Optional
-- ALTER TABLE public.review_feedback_comments OWNER TO postgres;
-- ALTER SEQUENCE public.review_feedback_comments_id_seq OWNER TO postgres;

