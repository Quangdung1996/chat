'use client';

import { Channel, ChannelHeader, MessageInput, MessageList, Thread, Window } from 'stream-chat-react';
import { useChannel } from 'stream-chat-react';

interface StreamChatWindowProps {
  channelId: string;
  channelType?: 'messaging' | 'team' | 'livestream';
}

export default function StreamChatWindow({ channelId, channelType = 'messaging' }: StreamChatWindowProps) {
  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#1c1c1e]">
      <Channel channel={{ id: channelId, type: channelType }}>
        <Window>
          {/* iOS-style header */}
          <div className="ios-chat-header">
            <ChannelHeader />
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-hidden">
            <MessageList />
          </div>

          {/* iOS-style input */}
          <div className="ios-message-input">
            <MessageInput />
          </div>
        </Window>
        
        {/* Thread for replies */}
        <Thread />
      </Channel>
    </div>
  );
}

