import { LegalScreen } from '@/components/LegalScreen';

export default function PrivacyScreen() {
  return (
    <LegalScreen
      title="Privacy Policy"
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      source={require('../../legal/PRIVACY-POLICY.md')}
    />
  );
}
