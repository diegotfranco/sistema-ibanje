import { View, Text } from '@react-pdf/renderer';
import { tw } from './theme.js';

// Shared fixed footer: generation date + church name on the left, page numbers on
// the right. `fixed` repeats it on every page of the document.
export function PageFooter({ churchName }: { churchName: string }) {
  return (
    <View
      style={tw(
        'absolute bottom-5 left-8 right-8 flex-row justify-between pt-1 border-t border-gray-200'
      )}
      fixed>
      <Text style={tw('text-[8px] font-roboto text-gray-500')}>
        Gerado em {new Date().toLocaleDateString('pt-BR')} · {churchName}
      </Text>
      <Text
        style={tw('text-[8px] font-roboto text-gray-500')}
        render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
          `Página ${pageNumber} de ${totalPages}`
        }
      />
    </View>
  );
}
