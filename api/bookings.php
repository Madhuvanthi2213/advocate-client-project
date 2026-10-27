<?php
declare(strict_types=1);
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    json_response(405, ['success' => false, 'message' => 'Use the booking form to send a request.']);
}
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
if (stripos($contentType, 'application/json') === false) {
    json_response(415, ['success' => false, 'message' => 'Unsupported request format.']);
}
$raw = file_get_contents('php://input');
$data = json_decode($raw ?: '', true);
if (!is_array($data)) json_response(400, ['success' => false, 'message' => 'Please check the submitted form.']);

$clean = static function ($value, int $max = 1000): string {
    if (!is_string($value)) return '';
    $value = trim(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value) ?? '');
    return mb_substr($value, 0, $max, 'UTF-8');
};
$name = $clean($data['full_name'] ?? '', 120);
$email = $clean($data['email'] ?? '', 190);
$phone = $clean($data['phone'] ?? '', 25);
$service = $clean($data['service'] ?? '', 80);
$date = $clean($data['preferred_date'] ?? '', 10);
$time = $clean($data['preferred_time'] ?? '', 40);
$message = $clean($data['message'] ?? '', 1000);
$consent = filter_var($data['consent'] ?? false, FILTER_VALIDATE_BOOLEAN);

$allowedServices = ['Family Law', 'Civil & Property', 'Criminal Defence', 'Cheque Bounce', 'Consumer Court', 'Motor Accident Claims', 'Labour & Service', 'Drafting & Documents', 'Other / Not sure'];
$dateObj = DateTime::createFromFormat('!Y-m-d', $date);
$today = new DateTime('today');

if ($name === '' || mb_strlen($name, 'UTF-8') < 2) json_response(422, ['success' => false, 'message' => 'Please enter your full name.']);
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) json_response(422, ['success' => false, 'message' => 'Please enter a valid email address.']);
if ($phone === '' || !preg_match('/^[0-9+\s().-]{7,25}$/', $phone)) json_response(422, ['success' => false, 'message' => 'Please enter a valid phone number.']);
if (!in_array($service, $allowedServices, true)) json_response(422, ['success' => false, 'message' => 'Please select a practice area.']);
if (!$dateObj || $dateObj->format('Y-m-d') !== $date || $dateObj < $today) json_response(422, ['success' => false, 'message' => 'Please select a valid future date.']);
if (!in_array($time, booking_times(), true)) json_response(422, ['success' => false, 'message' => 'Please select a preferred time.']);
if (!$consent) json_response(422, ['success' => false, 'message' => 'Please confirm consent to be contacted.']);

/* Very small anti-spam throttle: max 5 requests per 10 minutes per visitor session. */
if (session_status() !== PHP_SESSION_ACTIVE) @session_start();
$_SESSION['req_times'] = array_values(array_filter($_SESSION['req_times'] ?? [], static fn($t) => $t > time() - 600));
if (count($_SESSION['req_times']) >= 5) json_response(429, ['success' => false, 'message' => 'Too many requests. Please wait a few minutes or contact the office directly.']);

$prettyDate = fmt_date($date);
$sent = (new DateTime('now', new DateTimeZone('Asia/Kolkata')))->format('d M Y, h:i A') . ' IST';
$h = static fn(string $s): string => htmlspecialchars($s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');

$subject = "New consultation request: $name – $service";
$text = "New consultation request from the website\n"
      . "=========================================\n\n"
      . "Name:            $name\n"
      . "Phone:           $phone\n"
      . "Email:           $email\n"
      . "Practice area:   $service\n"
      . "Preferred date:  $prettyDate\n"
      . "Preferred time:  $time\n"
      . "Note:            " . ($message !== '' ? $message : '—') . "\n\n"
      . "Received: $sent\n"
      . "Reply to this email to answer the client directly.";
$row = static fn(string $k, string $v): string =>
    '<tr><td style="padding:9px 14px;background:#f8f0e6;font-weight:bold;color:#603A2B;width:150px;border-bottom:1px solid #eadbc8">' . $k . '</td>'
  . '<td style="padding:9px 14px;border-bottom:1px solid #eadbc8">' . $v . '</td></tr>';
$html = '<div style="font-family:Arial,sans-serif;color:#291812;max-width:560px;margin:auto">'
      . '<div style="background:#291812;color:#D6B99A;padding:18px 22px;font-size:18px">New consultation request</div>'
      . '<table style="width:100%;border-collapse:collapse;font-size:14px;border:1px solid #eadbc8">'
      . $row('Name', $h($name))
      . $row('Phone', '<a href="tel:' . $h(preg_replace('/[^+\d]/', '', $phone)) . '">' . $h($phone) . '</a>')
      . $row('Email', '<a href="mailto:' . $h($email) . '">' . $h($email) . '</a>')
      . $row('Practice area', $h($service))
      . $row('Preferred date', $h($prettyDate))
      . $row('Preferred time', $h($time))
      . $row('Note', $message !== '' ? nl2br($h($message)) : '—')
      . '</table>'
      . '<p style="font-size:12px;color:#7a6556">Received ' . $h($sent) . '. Reply to this email to answer the client directly.</p></div>';

try {
    smtp_send(MAIL_TO, $subject, $text, $html, $email, $name);
    $_SESSION['req_times'][] = time();
    json_response(201, ['success' => true, 'message' => 'Your consultation request has been sent.']);
} catch (Throwable $e) {
    error_log('Consultation email failed: ' . $e->getMessage());
    $msg = 'We could not send your request right now. Please try again later or contact the office directly.';
    if (is_local_request()) $msg .= ' [Local debug: ' . $e->getMessage() . ']';   // shown only when testing on your own computer
    json_response(500, ['success' => false, 'message' => $msg]);
}
