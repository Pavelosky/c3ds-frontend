import {
  Box,
  Typography,
  Divider,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Stack,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const SectionHeading = ({ children }) => (
  <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 1, fontWeight: 600 }}>
    {children}
  </Typography>
);

const SubHeading = ({ children }) => (
  <Typography variant="subtitle1" gutterBottom sx={{ mt: 2, mb: 0.5, fontWeight: 600 }}>
    {children}
  </Typography>
);

const CodeBlock = ({ children }) => (
  <Box
    component="pre"
    sx={{
      bgcolor: 'grey.900',
      color: 'grey.100',
      p: 2,
      borderRadius: 1,
      overflow: 'auto',
      fontFamily: 'monospace',
      fontSize: '0.85rem',
      lineHeight: 1.6,
      my: 1.5,
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
    }}
  >
    {children}
  </Box>
);

const InlineCode = ({ children }) => (
  <Box
    component="code"
    sx={{
      bgcolor: 'grey.200',
      color: 'text.primary',
      px: 0.5,
      py: 0.1,
      borderRadius: 0.5,
      fontFamily: 'monospace',
      fontSize: '0.85em',
    }}
  >
    {children}
  </Box>
);

const IntegrationGuide = () => {
  return (
    <Box sx={{ maxWidth: 900, pb: 4 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
        Device Integration Guide
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        This guide describes how to build a device that participates in the C3DS network. It covers
        the message format, authentication requirements, and the step-by-step process for sending a
        valid message to the server.
      </Typography>

      <Divider sx={{ my: 2 }} />

      {/* Prerequisites */}
      <SectionHeading>Prerequisites</SectionHeading>
      <Typography variant="body2" gutterBottom>
        Before a device can send messages, it must be registered with a C3DS operator. The operator
        will provide you with:
      </Typography>
      <List dense disablePadding sx={{ pl: 2 }}>
        <ListItem disableGutters>
          <ListItemText
            primary={
              <Typography variant="body2">
                A <strong>device certificate</strong> (<InlineCode>.pem</InlineCode> file) — your
                device&apos;s identity, signed by the C3DS Certificate Authority
              </Typography>
            }
          />
        </ListItem>
        <ListItem disableGutters>
          <ListItemText
            primary={
              <Typography variant="body2">
                A <strong>private key</strong> (<InlineCode>.key</InlineCode> file) — used to sign
                each message
              </Typography>
            }
          />
        </ListItem>
      </List>
      <Alert severity="warning" sx={{ mt: 1.5 }}>
        Keep the private key secure. Do not transmit it or store it in plaintext if avoidable.
      </Alert>

      <Divider sx={{ my: 2 }} />

      {/* Message Format */}
      <SectionHeading>Message Format</SectionHeading>
      <Typography variant="body2" gutterBottom>
        Messages are sent as JSON in the HTTP request body.
      </Typography>

      <SubHeading>Required Fields</SubHeading>
      <Table size="small" sx={{ mb: 2 }}>
        <TableHead>
          <TableRow>
            <TableCell><strong>Field</strong></TableCell>
            <TableCell><strong>Type</strong></TableCell>
            <TableCell><strong>Description</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell><InlineCode>message_type</InlineCode></TableCell>
            <TableCell>string (max 50 chars)</TableCell>
            <TableCell>Category of the message. See Message Types below.</TableCell>
          </TableRow>
          <TableRow>
            <TableCell><InlineCode>timestamp</InlineCode></TableCell>
            <TableCell>string (ISO 8601)</TableCell>
            <TableCell>
              The time the event was observed, in UTC. Example:{' '}
              <InlineCode>2026-02-17T14:30:00Z</InlineCode>
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell><InlineCode>data</InlineCode></TableCell>
            <TableCell>object</TableCell>
            <TableCell>Arbitrary sensor payload. Structure is defined by the device builder.</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <SubHeading>Optional Fields in data</SubHeading>
      <Typography variant="body2" gutterBottom>
        The <InlineCode>data</InlineCode> object is flexible. The following field is recognised by
        the dashboard and should be used where applicable:
      </Typography>
      <Table size="small" sx={{ mb: 2 }}>
        <TableHead>
          <TableRow>
            <TableCell><strong>Field</strong></TableCell>
            <TableCell><strong>Type</strong></TableCell>
            <TableCell><strong>Description</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell><InlineCode>confidence</InlineCode></TableCell>
            <TableCell>float (0.0–1.0)</TableCell>
            <TableCell>
              How confident the device is in the detection. <InlineCode>1.0</InlineCode> = certain,{' '}
              <InlineCode>0.0</InlineCode> = no confidence.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      <SubHeading>Example Message Bodies</SubHeading>
      <CodeBlock>{`{
  "message_type": "alert",
  "timestamp": "2026-02-17T14:30:00Z",
  "data": {
    "confidence": 0.87,
    "frequency_hz": 433920000,
    "signal_strength_dbm": -72,
    "duration_ms": 340
  }
}`}</CodeBlock>
      <CodeBlock>{`{
  "message_type": "heartbeat",
  "timestamp": "2026-02-17T14:00:00Z",
  "data": {
    "uptime_seconds": 86400,
    "battery_percent": 91
  }
}`}</CodeBlock>

      <Divider sx={{ my: 2 }} />

      {/* Message Types */}
      <SectionHeading>Message Types</SectionHeading>
      <Typography variant="body2" gutterBottom>
        The <InlineCode>message_type</InlineCode> field is a free-form string, but the following
        values are recommended for consistency:
      </Typography>
      <Table size="small" sx={{ mb: 2 }}>
        <TableHead>
          <TableRow>
            <TableCell><strong>Value</strong></TableCell>
            <TableCell><strong>When to use</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {[
            ['alert', 'A drone or suspicious signal has been detected'],
            ['heartbeat', 'Periodic check-in to confirm the device is online'],
            ['status', 'A change in device state (e.g. battery low, sensor fault)'],
            ['test', 'During development and testing only'],
          ].map(([value, desc]) => (
            <TableRow key={value}>
              <TableCell><InlineCode>{value}</InlineCode></TableCell>
              <TableCell>{desc}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Divider sx={{ my: 2 }} />

      {/* Authentication */}
      <SectionHeading>Authentication</SectionHeading>
      <Typography variant="body2" gutterBottom>
        C3DS uses <strong>mutual certificate authentication</strong> for device messages. Every
        request must include two custom HTTP headers.
      </Typography>
      <Table size="small" sx={{ mb: 2 }}>
        <TableHead>
          <TableRow>
            <TableCell><strong>Header</strong></TableCell>
            <TableCell><strong>Value</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <TableRow>
            <TableCell><InlineCode>X-Device-Certificate</InlineCode></TableCell>
            <TableCell>Your device certificate (PEM format), encoded as Base64</TableCell>
          </TableRow>
          <TableRow>
            <TableCell><InlineCode>X-Device-Signature</InlineCode></TableCell>
            <TableCell>A cryptographic signature of the raw request body, encoded as Base64</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <Typography variant="body2" color="text.secondary">
        Both values must be Base64-encoded. Standard Base64 (not URL-safe) is expected.
      </Typography>

      <Divider sx={{ my: 2 }} />

      {/* Step by Step */}
      <SectionHeading>How to Send a Message: Step by Step</SectionHeading>

      <SubHeading>Step 1 — Prepare the message body</SubHeading>
      <Typography variant="body2" gutterBottom>
        Construct your JSON message as a UTF-8 encoded byte string. This exact byte string is what
        you will sign — do not modify it afterwards (e.g. do not re-serialise or pretty-print it).
      </Typography>
      <CodeBlock>{`body = utf8_encode({
  "message_type": "alert",
  "timestamp": "2026-02-17T14:30:00Z",
  "data": { "confidence": 0.87 }
})`}</CodeBlock>

      <SubHeading>Step 2 — Sign the message body</SubHeading>
      <Typography variant="body2" gutterBottom>
        Sign the raw message body bytes using your device&apos;s private key.
      </Typography>
      <List dense disablePadding sx={{ pl: 2, mb: 1 }}>
        <ListItem disableGutters>
          <ListItemText
            primary={
              <Typography variant="body2">
                <strong>RSA key:</strong> RSA with PKCS#1 v1.5 padding, hash SHA-256, input = raw
                UTF-8 body bytes
              </Typography>
            }
          />
        </ListItem>
        <ListItem disableGutters>
          <ListItemText
            primary={
              <Typography variant="body2">
                <strong>ECDSA key:</strong> ECDSA, hash SHA-256, input = raw UTF-8 body bytes
              </Typography>
            }
          />
        </ListItem>
      </List>
      <CodeBlock>{`signature_bytes = sign(private_key, body)
signature_b64   = base64_encode(signature_bytes)`}</CodeBlock>

      <SubHeading>Step 3 — Encode your certificate</SubHeading>
      <Typography variant="body2" gutterBottom>
        Read your device certificate file (PEM format). Base64-encode the entire PEM content,
        including the <InlineCode>-----BEGIN CERTIFICATE-----</InlineCode> and{' '}
        <InlineCode>-----END CERTIFICATE-----</InlineCode> lines.
      </Typography>
      <CodeBlock>{`cert_pem_bytes = read_file("device.pem")
cert_b64       = base64_encode(cert_pem_bytes)`}</CodeBlock>

      <SubHeading>Step 4 — Send the HTTP request</SubHeading>
      <Typography variant="body2" gutterBottom>
        Send an HTTPS POST request to <InlineCode>POST /api/device/message/</InlineCode>:
      </Typography>
      <CodeBlock>{`POST /api/device/message/
Content-Type: application/json
X-Device-Certificate: <cert_b64>
X-Device-Signature: <signature_b64>

<body>`}</CodeBlock>
      <Alert severity="info" sx={{ mt: 1 }}>
        Use HTTPS in production. HTTP requests will not be accepted by a correctly configured server.
      </Alert>

      <Divider sx={{ my: 2 }} />

      {/* Server Validation */}
      <SectionHeading>Server Validation Steps</SectionHeading>
      <Typography variant="body2" gutterBottom>
        When the server receives your request, it performs the following checks in order. A failure
        at any step returns an error and the message is rejected.
      </Typography>
      <List dense>
        {[
          'Both X-Device-Certificate and X-Device-Signature headers are present',
          'Certificate is a valid X.509 PEM format',
          'Certificate is signed by the C3DS Certificate Authority',
          'Current time falls within the certificate validity period',
          'Device UUID (from certificate Common Name) exists in the database',
          'Device status is not REVOKED',
          'Message signature matches the request body',
          'Request body is valid JSON',
        ].map((step, i) => (
          <ListItem key={i} disableGutters sx={{ py: 0.25 }}>
            <ListItemText
              primary={
                <Typography variant="body2">
                  <strong>{i + 1}.</strong> {step}
                </Typography>
              }
            />
          </ListItem>
        ))}
      </List>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        If all checks pass, the message is stored and the device status is automatically set to
        ACTIVE.
      </Typography>

      <Divider sx={{ my: 2 }} />

      {/* Response Format */}
      <SectionHeading>Response Format</SectionHeading>

      <SubHeading>Success (HTTP 200)</SubHeading>
      <CodeBlock>{`{
  "status": "success",
  "saved": true,
  "device_id": "e3bf7037-ca57-4928-9476-0e40e8b5d30d",
  "timestamp": "2026-02-17T14:30:05.123456Z",
  "message": "Message stored successfully."
}`}</CodeBlock>

      <SubHeading>Error Responses</SubHeading>
      <Table size="small" sx={{ mb: 1.5 }}>
        <TableHead>
          <TableRow>
            <TableCell><strong>HTTP Status</strong></TableCell>
            <TableCell><strong>Meaning</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {[
            ['400 Bad Request', 'Malformed certificate, signature format, or invalid JSON body'],
            ['401 Unauthorized', 'Missing headers, certificate not signed by CA, or signature mismatch'],
            ['403 Forbidden', 'Device certificate has been revoked'],
            ['404 Not Found', 'Device UUID not found in the database'],
            ['500 Internal Server Error', 'Server configuration error — contact the operator'],
          ].map(([code, meaning]) => (
            <TableRow key={code}>
              <TableCell><InlineCode>{code}</InlineCode></TableCell>
              <TableCell>{meaning}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <Typography variant="body2" gutterBottom>
        Error responses include a JSON body:
      </Typography>
      <CodeBlock>{`{ "error": "Description of what went wrong." }`}</CodeBlock>

      <Divider sx={{ my: 2 }} />

      {/* Timestamp */}
      <SectionHeading>Timestamp Handling</SectionHeading>
      <List dense disablePadding sx={{ pl: 2 }}>
        <ListItem disableGutters>
          <ListItemText
            primary={
              <Typography variant="body2">
                Always use ISO 8601 format with UTC timezone:{' '}
                <InlineCode>2026-02-17T14:30:00Z</InlineCode>
              </Typography>
            }
          />
        </ListItem>
        <ListItem disableGutters>
          <ListItemText
            primary={
              <Typography variant="body2">
                The <InlineCode>timestamp</InlineCode> field should reflect when the{' '}
                <strong>event occurred</strong>, not when the message was sent
              </Typography>
            }
          />
        </ListItem>
        <ListItem disableGutters>
          <ListItemText
            primary={
              <Typography variant="body2">
                If no <InlineCode>timestamp</InlineCode> is provided, the server uses its own
                current time
              </Typography>
            }
          />
        </ListItem>
      </List>

      <Divider sx={{ my: 2 }} />

      {/* Security Notes */}
      <SectionHeading>Security Notes</SectionHeading>
      <Stack spacing={1}>
        <Alert severity="error">
          <strong>Never share your private key.</strong> It is the sole proof of your device&apos;s
          identity.
        </Alert>
        <Alert severity="warning">
          <strong>Do not reuse signatures.</strong> Always sign the current message body fresh — a
          previous signature will fail because the body will differ.
        </Alert>
        <Alert severity="warning">
          <strong>Certificate expiry.</strong> Certificates have a fixed validity period. Contact
          your operator before expiry to arrange renewal. An expired certificate will be rejected.
        </Alert>
        <Alert severity="info">
          <strong>Revocation.</strong> If your device is lost, stolen, or compromised, contact your
          operator immediately to have the certificate revoked.
        </Alert>
      </Stack>

      <Divider sx={{ my: 2 }} />

      {/* FAQ */}
      <SectionHeading>Frequently Asked Questions</SectionHeading>

      {[
        {
          q: 'Can I send any data in the data field?',
          a: 'Yes. The data field accepts any valid JSON object. Structure it however makes sense for your sensor. Fields not recognised by the dashboard are stored but not displayed.',
        },
        {
          q: 'What if my device clock is wrong?',
          a: 'The server does not validate that your timestamp matches its own clock. However, an accurate timestamp is important for the dashboard to display events in the correct order. Use NTP to keep your device clock synchronised.',
        },
        {
          q: 'What happens if the server fails to store my message?',
          a: 'The response will include "saved": false but will still return HTTP 200. This indicates a server-side storage failure. Your device does not need to retry unless you consider the data critical.',
        },
        {
          q: 'Does the order of JSON keys matter?',
          a: 'No, but the exact bytes of the body you sign must be the same bytes you send. Do not re-serialise, reformat, or compress the body between signing and sending.',
        },
        {
          q: 'Which certificate algorithm should I use?',
          a: 'ECDSA P-256 is the default and recommended for most devices — it is fast and memory-efficient. RSA-2048 or RSA-4096 are available if your platform or organisation requires RSA. The algorithm is chosen during device registration and cannot be changed without regenerating the certificate.',
        },
      ].map(({ q, a }) => (
        <Accordion key={q} disableGutters elevation={0} sx={{ border: '1px solid', borderColor: 'divider', mb: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="body2" fontWeight={600}>
              {q}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary">
              {a}
            </Typography>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

export default IntegrationGuide;
