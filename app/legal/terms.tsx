import { LegalScreen } from '@/components/LegalScreen';

export default function TermsScreen() {
  return (
    <LegalScreen
      title="Terms of Service"
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      source={require('../../legal/TERMS-OF-SERVICE.md')}
    />
  );
}
