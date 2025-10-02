-- Add soft delete support to FAQ items

ALTER TABLE public.faq_items
ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Create index for efficient querying of non-deleted items
CREATE INDEX idx_faq_items_deleted_at ON public.faq_items(deleted_at) WHERE deleted_at IS NULL;
