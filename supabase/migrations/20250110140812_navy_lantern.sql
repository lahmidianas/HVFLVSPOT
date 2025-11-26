-- Drop existing functions
DROP FUNCTION IF EXISTS begin_ticket_purchase(UUID, UUID, UUID, INTEGER);
DROP FUNCTION IF EXISTS complete_ticket_purchase(UUID, UUID, UUID, INTEGER, DECIMAL, TEXT);
DROP FUNCTION IF EXISTS rollback_ticket_purchase(UUID);

-- Function to begin ticket purchase transaction
CREATE OR REPLACE FUNCTION begin_ticket_purchase(
  p_ticket_id UUID,
  p_user_id UUID,
  p_event_id UUID,
  p_quantity INTEGER
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ticket tickets%ROWTYPE;
  v_result jsonb;
BEGIN
  -- Lock the ticket row for update
  SELECT * INTO v_ticket
  FROM tickets
  WHERE id = p_ticket_id
  FOR UPDATE SKIP LOCKED;  -- Use SKIP LOCKED for better concurrency

  -- Validate ticket exists and has sufficient quantity
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Ticket not found'
    );
  END IF;

  IF v_ticket.quantity < p_quantity THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Insufficient tickets available'
    );
  END IF;

  -- Update ticket inventory immediately to prevent race conditions
  UPDATE tickets
  SET quantity = quantity - p_quantity
  WHERE id = p_ticket_id
  AND quantity >= p_quantity;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Ticket quantity changed during purchase'
    );
  END IF;

  -- Return success with ticket data
  RETURN jsonb_build_object(
    'success', true,
    'ticket', row_to_json(v_ticket)
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', SQLERRM
    );
END;
$$;

-- Function to complete ticket purchase transaction
CREATE OR REPLACE FUNCTION complete_ticket_purchase(
  p_ticket_id UUID,
  p_user_id UUID,
  p_event_id UUID,
  p_quantity INTEGER,
  p_total_price DECIMAL,
  p_qr_code TEXT
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking bookings%ROWTYPE;
BEGIN
  -- Create booking record
  INSERT INTO bookings (
    user_id,
    event_id,
    ticket_id,
    quantity,
    total_price,
    status,
    qr_code
  )
  VALUES (
    p_user_id,
    p_event_id,
    p_ticket_id,
    p_quantity,
    p_total_price,
    'confirmed',
    p_qr_code
  )
  RETURNING * INTO v_booking;

  -- Return success with booking data
  RETURN jsonb_build_object(
    'success', true,
    'booking', row_to_json(v_booking)
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', SQLERRM
    );
END;
$$;