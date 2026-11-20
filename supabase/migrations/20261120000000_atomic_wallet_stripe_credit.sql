CREATE OR REPLACE FUNCTION public.credit_wallet_once(
  p_user_id uuid,
  p_user_email text,
  p_amount numeric,
  p_stripe_session_id text,
  p_note text DEFAULT 'Stripe Top-Up'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_balance numeric(10, 5);
BEGIN
  IF p_user_id IS NULL
     OR p_user_email IS NULL
     OR p_amount IS NULL
     OR p_amount <= 0
     OR p_stripe_session_id IS NULL
     OR btrim(p_stripe_session_id) = '' THEN
    RAISE EXCEPTION 'A user, positive amount, and Stripe session ID are required.';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext(p_stripe_session_id), 918273);

  SELECT wallet_balance
    INTO v_balance
    FROM public.profiles
   WHERE id = p_user_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Wallet profile not found for user %.', p_user_id;
  END IF;

  IF EXISTS (
    SELECT 1
      FROM public.wallet_transactions
     WHERE stripe_session_id = p_stripe_session_id
  ) THEN
    RETURN jsonb_build_object(
      'success', true,
      'balance', v_balance,
      'duplicate', true
    );
  END IF;

  v_balance := round(COALESCE(v_balance, 0) + p_amount, 5);

  UPDATE public.profiles
     SET wallet_balance = v_balance
   WHERE id = p_user_id;

  INSERT INTO public.wallet_transactions (
    user_id,
    user_email,
    type,
    amount,
    balance_after,
    stripe_session_id,
    metadata
  ) VALUES (
    p_user_id,
    lower(p_user_email),
    'deposit',
    p_amount,
    v_balance,
    p_stripe_session_id,
    jsonb_build_object('note', COALESCE(p_note, 'Stripe Top-Up'))
  );

  RETURN jsonb_build_object(
    'success', true,
    'balance', v_balance,
    'duplicate', false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.credit_wallet_once(uuid, text, numeric, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.credit_wallet_once(uuid, text, numeric, text, text) TO service_role;
