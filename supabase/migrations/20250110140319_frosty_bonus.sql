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
  FOR UPDATE NOWAIT;  -- NOWAIT fails immediately if lock cannot be acquired

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

  -- Return success with ticket data
  RETURN jsonb_build_object(
    'success', true,
    'ticket', row_to_json(v_ticket)
  );
EXCEPTION
  WHEN lock_not_available THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Ticket is currently being purchased by another user'
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
  -- Create booking
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

  -- Update ticket inventory
  UPDATE tickets
  SET quantity = quantity - p_quantity
  WHERE id = p_ticket_id;

  -- Return success with booking data
  RETURN jsonb_build_object(
    'success', true,
    'booking', row_to_json(v_booking)
  );
END;
$$;

-- Function to rollback ticket purchase
CREATE OR REPLACE FUNCTION rollback_ticket_purchase(
  p_ticket_id UUID
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Release any locks (transaction will be rolled back)
  RETURN;
END;
$$;