import {
  Box,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Divider,
  Chip,
  Grid,
} from '@mui/material';
import {
  Sensors,
  Security,
  Public,
  DevicesOther,
  HowToReg,
  DownloadForOffline,
  CloudUpload,
  CheckCircle,
} from '@mui/icons-material';
import { BaseLayout } from '../components/BaseLayout';

const Section = ({ icon, title, children }) => (
  <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
      <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
      <Typography variant="h6" fontWeight={700}>
        {title}
      </Typography>
    </Box>
    {children}
  </Paper>
);

const participantSteps = [
  {
    label: 'Create an account',
    icon: <HowToReg />,
    description:
      'Register on this site and choose the Participant role. This gives you access to the device management dashboard where you can add and monitor your own sensors.',
  },
  {
    label: 'Register your device',
    icon: <DevicesOther />,
    description:
      'Go to My Devices and add a new device. Give it a name and select the algorithm that suits your hardware — ECDSA P-256 works great for most devices including Raspberry Pi, ESP32, and ESP8266.',
  },
  {
    label: 'Download your certificate',
    icon: <DownloadForOffline />,
    description:
      'Once the device is registered, download the certificate bundle from the device detail page. You will receive a .pem certificate file and a .key private key file. Keep your private key safe — do not share it.',
  },
  {
    label: 'Deploy your device',
    icon: <CloudUpload />,
    description:
      'Install the certificate files on your device. Your device should send POST requests to /api/device/message/ with the certificate attached as a header, along with a signed payload in JSON format.',
  },
  {
    label: 'Start contributing',
    icon: <CheckCircle />,
    description:
      'Once your first message arrives, your device status will automatically change to Active and it will appear on the public dashboard map for everyone to see.',
  },
];

const algorithmRows = [
  { name: 'ECDSA P-256', best: 'ESP32, ESP8266, mobile', note: 'Recommended default' },
  { name: 'ECDSA P-384', best: 'High-security IoT', note: 'Stronger ECDSA variant' },
  { name: 'RSA-2048', best: 'General purpose', note: 'Broad compatibility' },
  { name: 'RSA-4096', best: 'Raspberry Pi 4+', note: 'Maximum security' },
];

export default function About() {
  return (
    <BaseLayout maxWidth="md">
      {/* Hero */}
      <Box sx={{ textAlign: 'center', mb: 5 }}>
        <Typography
          variant="h3"
          fontWeight={800}
          sx={{ fontFamily: 'monospace', letterSpacing: 2, color: 'primary.main' }}
        >
          C3DS
        </Typography>
        <Typography variant="h5" color="text.secondary" sx={{ mt: 1 }}>
          Civilian Distributed Drone Detection System
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2, maxWidth: 560, mx: 'auto' }}>
          A crowdsourced early-warning network that turns everyday IoT devices into distributed
          drone detection sensors — built with security and interoperability at its core.
        </Typography>
      </Box>

      <Divider sx={{ mb: 4 }} />

      {/* What is this? */}
      <Section icon={<Public fontSize="large" />} title="What is C3DS?">
        <Typography variant="body1" paragraph>
          C3DS is an open infrastructure that lets civilians contribute their own IoT sensors — such
          as a Raspberry Pi or an ESP32 — to a national early-warning network. Instead of relying on
          expensive, proprietary hardware, C3DS is{' '}
          <strong>device-agnostic</strong>: any sensor that can send an HTTPS request can
          participate.
        </Typography>
        <Typography variant="body1" paragraph>
          The system was inspired by Ukraine's <em>Sky Fortress</em> acoustic drone detection system with American
          defence platforms. C3DS is designed from the ground up so that civilian and government
          systems can talk to each other.
        </Typography>
        <Typography variant="body1">
          All data contributed by participants is visible on the public dashboard map in real time.
        </Typography>
      </Section>

      {/* How it works */}
      <Section icon={<Sensors fontSize="large" />} title="How it works">
        <Typography variant="body1" sx={{ mb: 2 }}>
          Every device that joins the network receives a unique{' '}
          <strong>X.509 certificate</strong> signed by the C3DS Certificate Authority. When the
          device sends sensor data, it signs the message with its private key. The server verifies
          both the certificate and the signature before accepting any data — so only authorised
          devices can contribute.
        </Typography>
       
      </Section>

      {/* Security */}
      <Section icon={<Security fontSize="large" />} title="Security & trust">
        <Typography variant="body1" paragraph>
          Security is built into every layer:
        </Typography>
        <Box component="ul" sx={{ pl: 2, mt: 0 }}>
          {[
            'Your device certificate is unique — revoke it any time from the dashboard.',
            'Messages are rejected if the certificate is expired or revoked.',
            'Your private key never leaves your device — the server only stores the public certificate.',
            'All API communication uses HTTPS.',
            'The system is designed to be compliant with OWASP Top 10 security guidelines.',
          ].map((item) => (
            <Typography key={item} component="li" variant="body2" sx={{ mb: 0.5 }}>
              {item}
            </Typography>
          ))}
        </Box>
      </Section>

      {/* Algorithm choice */}
      <Section icon={<DevicesOther fontSize="large" />} title="Choosing the right algorithm">
        <Typography variant="body1" sx={{ mb: 2 }}>
          When you register a device you can pick a cryptographic algorithm. The right choice
          depends on your hardware:
        </Typography>
        <Box sx={{ overflowX: 'auto' }}>
          <Box
            component="table"
            sx={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.875rem',
              '& th, & td': { px: 2, py: 1, textAlign: 'left', borderBottom: '1px solid', borderColor: 'divider' },
              '& th': { fontWeight: 700, bgcolor: 'action.hover' },
            }}
          >
            <thead>
              <tr>
                <th>Algorithm</th>
                <th>Best for</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {algorithmRows.map((row) => (
                <tr key={row.name}>
                  <td>
                    <Typography component="span" fontFamily="monospace" fontSize="0.875rem">
                      {row.name}
                    </Typography>
                  </td>
                  <td>{row.best}</td>
                  <td>
                    {row.note === 'Recommended default' ? (
                      <Chip label={row.note} size="small" color="success" />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        {row.note}
                      </Typography>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
          Not sure? Pick <strong>ECDSA P-256</strong> — it works on almost every device and is the
          most efficient option.
        </Typography>
      </Section>

      {/* Step-by-step guide */}
      <Section icon={<HowToReg fontSize="large" />} title="How to join as a participant">
        <Stepper orientation="vertical" nonLinear activeStep={-1}>
          {participantSteps.map((step) => (
            <Step key={step.label} active>
              <StepLabel
                icon={<Box sx={{ color: 'primary.main', display: 'flex' }}>{step.icon}</Box>}
              >
                <Typography fontWeight={600}>{step.label}</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary">
                  {step.description}
                </Typography>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </Section>

      {/* Device types */}
      <Section icon={<DevicesOther fontSize="large" />} title="Supported devices">
        <Typography variant="body1" sx={{ mb: 2 }}>
          If your device can make an HTTPS request and perform a cryptographic signature, it can
          join C3DS. Tested and known-working devices include:
        </Typography>
        <Grid container spacing={1}>
          {[
            'Raspberry Pi 4 / 5',
            'Raspberry Pi Zero 2 W',
            'ESP32',
            'ESP8266',
            'Arduino (with WiFi shield)',
            'Any Linux SBC',
          ].map((device) => (
            <Grid item key={device}>
              <Chip label={device} variant="outlined" />
            </Grid>
          ))}
        </Grid>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          The ESP8266 and ESP32 code bundle (C header file with your certificate pre-loaded) can be
          downloaded directly from the device detail page after certificate generation.
        </Typography>
      </Section>
    </BaseLayout>
  );
}
