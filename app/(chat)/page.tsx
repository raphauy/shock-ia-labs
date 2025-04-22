import { cookies } from 'next/headers';
import { auth } from '@/app/(auth)/auth';
import { Chat } from '@/components/chat';
import { DEFAULT_CHAT_MODEL } from '@/lib/ai/models';
import { generateUUID } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { getAllUserTools } from '@/lib/db/queries';

export default async function Page() {
  const id = generateUUID();

  // Obtener la sesión del usuario
  const session = await auth();
  const userId = session?.user?.id;

  // Obtener todas las tools del usuario
  let userTools: {
    totalTools: number;
    tools: Array<{ name: string; mcpName: string }>;
  } = { totalTools: 0, tools: [] };
  if (userId) {
    userTools = await getAllUserTools({ userId });
  }

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('chat-model');

  if (!modelIdFromCookie) {
    return (
      <>
        <Chat
          key={id}
          id={id}
          initialMessages={[]}
          selectedChatModel={DEFAULT_CHAT_MODEL}
          selectedVisibilityType="private"
          isReadonly={false}
          userTools={userTools}
        />
        <DataStreamHandler id={id} />
      </>
    );
  }

  return (
    <>
      <Chat
        key={id}
        id={id}
        initialMessages={[]}
        selectedChatModel={modelIdFromCookie.value}
        selectedVisibilityType="private"
        isReadonly={false}
        userTools={userTools}
      />
      <DataStreamHandler id={id} />
    </>
  );
}
