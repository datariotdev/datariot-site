-- Pause Animated Shorts without deleting videos, media, or engagement.
-- To resume, drop these two policies and re-enable ANIMATED_SHORTS_ENABLED.
CREATE POLICY "Pause animated shorts reads"
ON public.videos AS RESTRICTIVE
FOR SELECT TO anon, authenticated
USING (category IS DISTINCT FROM 'animated-shorts');

CREATE POLICY "Pause animated shorts uploads"
ON public.videos AS RESTRICTIVE
FOR INSERT TO anon, authenticated
WITH CHECK (category IS DISTINCT FROM 'animated-shorts');
