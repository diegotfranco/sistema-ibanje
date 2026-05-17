import path from 'node:path';
import { Document, Page, View, Text, Font } from '@react-pdf/renderer';
import { createTw } from 'react-pdf-tailwind';

const FONTSOURCE = path.resolve(import.meta.dirname, '../../../../node_modules/@fontsource');

Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: path.join(FONTSOURCE, 'roboto/files/roboto-latin-400-normal.woff'),
      fontWeight: 400
    },
    {
      src: path.join(FONTSOURCE, 'roboto/files/roboto-latin-700-normal.woff'),
      fontWeight: 700
    },
    {
      src: path.join(FONTSOURCE, 'roboto/files/roboto-latin-500-normal.woff'),
      fontWeight: 500
    }
  ]
});

Font.register({
  family: 'NotoSans',
  fonts: [
    {
      src: path.join(FONTSOURCE, 'noto-sans/files/noto-sans-latin-400-normal.woff'),
      fontWeight: 400
    },
    {
      src: path.join(FONTSOURCE, 'noto-sans/files/noto-sans-latin-700-normal.woff'),
      fontWeight: 700
    }
  ]
});

const tw = createTw({
  fontFamily: {
    roboto: ['Roboto'],
    noto: ['NotoSans']
  }
});

interface MinutePdfProps {
  minute: {
    minuteNumber: string;
    presidingPastorName: string | null;
    secretaryName: string | null;
    openingTime: string | null;
    closingTime: string | null;
    boardMeeting: { meetingDate: string; type: string };
  };
  versionContent: unknown;
  attendersPresent?: Array<{ id: number; name: string }>;
  church: {
    name: string;
    cnpj: string;
    addressStreet: string;
    addressNumber: string;
    addressDistrict: string;
    addressCity: string;
    addressState: string;
  };
}

interface TipTapNode {
  type: string;
  content?: TipTapNode[];
  marks?: Array<{ type: string }>;
  text?: string;
  attrs?: Record<string, unknown>;
  level?: number;
}

function renderTipTapNode(node: TipTapNode | null, key?: string | number): React.ReactNode {
  if (!node) return null;

  const { type, content = [], marks = [], text = '', attrs = {} } = node;

  if (type === 'doc') {
    return content.map((child, i) => renderTipTapNode(child, i));
  }

  if (type === 'paragraph') {
    const children = content.map((child, i) => renderTipTapNode(child, i));
    return (
      <Text key={key} style={tw('text-[11pt] font-roboto text-justify mb-2 leading-snug')}>
        {children}
      </Text>
    );
  }

  if (type === 'heading') {
    const level = (attrs.level as number) || 1;
    const sizeMap: Record<number, string> = { 1: '16pt', 2: '14pt', 3: '12pt' };
    const size = sizeMap[level] || '12pt';
    const children = content.map((child, i) => renderTipTapNode(child, i));
    return (
      <Text key={key} style={tw(`text-[${size}] font-roboto font-bold mt-2 mb-2`)}>
        {children}
      </Text>
    );
  }

  if (type === 'bulletList') {
    return (
      <View key={key}>
        {content.map((item, i) => (
          <View key={i} style={tw('flex-row mb-1')}>
            <Text style={tw('w-4 text-[11pt] font-roboto')}>•</Text>
            <View style={tw('flex-1 ml-2')}>
              {item.content?.map((child, j) => renderTipTapNode(child, j))}
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (type === 'orderedList') {
    return (
      <View key={key}>
        {content.map((item, i) => (
          <View key={i} style={tw('flex-row mb-1')}>
            <Text style={tw('w-6 text-[11pt] font-roboto')}>{i + 1}.</Text>
            <View style={tw('flex-1 ml-2')}>
              {item.content?.map((child, j) => renderTipTapNode(child, j))}
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (type === 'listItem') {
    return content.map((child, i) => renderTipTapNode(child, i));
  }

  if (type === 'hardBreak') {
    return '\n';
  }

  if (type === 'text') {
    let style = tw('text-[11pt] font-roboto');

    if (marks && Array.isArray(marks)) {
      for (const mark of marks) {
        if (mark.type === 'bold') {
          style = { ...style, fontWeight: 700 };
        }
        if (mark.type === 'italic') {
          style = { ...style, fontStyle: 'italic' };
        }
        if (mark.type === 'underline') {
          style = { ...style, textDecoration: 'underline' };
        }
      }
    }

    return (
      <Text key={key} style={style}>
        {text}
      </Text>
    );
  }

  if (content && Array.isArray(content)) {
    return content.map((child, i) => renderTipTapNode(child, i));
  }

  return null;
}

function SignatureBlock({
  presidingPastorName,
  secretaryName
}: {
  presidingPastorName: string | null;
  secretaryName: string | null;
}) {
  return (
    <View wrap={false} style={tw('px-12 mt-auto')}>
      <View style={tw('flex-row justify-between')}>
        <View style={tw('w-[45%] mt-12 px-4')}>
          <View style={tw('h-12')} />
          <View style={tw('mb-1 border-t border-zinc-600')} />
          <Text style={tw('text-xs font-roboto font-medium text-center')}>
            {secretaryName || '___________________'}
          </Text>
          <Text style={tw('text-xs font-roboto text-center text-gray-600')}>Secretário</Text>
        </View>
        <View style={tw('w-[45%] mt-12 px-4')}>
          <View style={tw('h-12')} />
          <View style={tw('mb-1 border-t border-zinc-600')} />
          <Text style={tw('text-xs font-roboto font-medium text-center')}>
            {presidingPastorName || '___________________'}
          </Text>
          <Text style={tw('text-xs font-roboto text-center text-gray-600')}>Presidente</Text>
        </View>
      </View>
    </View>
  );
}

function MembersSignaturePage({
  attendersPresent
}: {
  attendersPresent: Array<{ id: number; name: string }>;
}) {
  const rows: Array<[{ id: number; name: string }, { id: number; name: string } | null]> = [];
  for (let i = 0; i < attendersPresent.length; i += 2) {
    rows.push([attendersPresent[i]!, attendersPresent[i + 1] ?? null]);
  }

  return (
    <Page size="A4" style={tw('p-12 pb-16 font-roboto')}>
      <View>
        {rows.map(([left, right], i) => (
          <View key={i} style={tw('flex-row justify-between mb-8')}>
            <View style={tw('w-[45%] px-2')}>
              <View style={tw('mb-1 border-t border-zinc-600 mt-8')} />
              <Text style={tw('text-xs font-roboto text-center')}>{left.name}</Text>
            </View>
            <View style={tw('w-[45%] px-2')}>
              {right ? (
                <>
                  <View style={tw('mb-1 border-t border-zinc-600 mt-8')} />
                  <Text style={tw('text-xs font-roboto text-center')}>{right.name}</Text>
                </>
              ) : null}
            </View>
          </View>
        ))}
      </View>
    </Page>
  );
}

export function MinutePdf({ minute, versionContent, attendersPresent }: MinutePdfProps) {
  let bodyContent: React.ReactNode = null;
  try {
    if (versionContent && typeof versionContent === 'object') {
      bodyContent = renderTipTapNode(versionContent as TipTapNode);
    }
  } catch {
    bodyContent = (
      <Text style={tw('text-[11pt] font-roboto text-gray-500')}>Conteúdo indisponível.</Text>
    );
  }

  if (!bodyContent) {
    bodyContent = (
      <Text style={tw('text-[11pt] font-roboto text-gray-500')}>Conteúdo indisponível.</Text>
    );
  }

  return (
    <Document>
      <Page size="A4" style={tw('p-12 pb-16 font-roboto flex flex-col')}>
        <View style={tw('flex-1')}>{bodyContent}</View>

        <SignatureBlock
          presidingPastorName={minute.presidingPastorName}
          secretaryName={minute.secretaryName}
        />
      </Page>
      {attendersPresent && attendersPresent.length > 0 && (
        <MembersSignaturePage attendersPresent={attendersPresent} />
      )}
    </Document>
  );
}
