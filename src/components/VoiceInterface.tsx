import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { RealtimeChat } from '@/utils/RealtimeAudio';
import { Phone, PhoneOff, Mic } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface VoiceInterfaceProps {
  onSpeakingChange: (speaking: boolean) => void;
}

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({ onSpeakingChange }) => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const chatRef = useRef<RealtimeChat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentTranscript]);

  const handleMessage = (event: any) => {
    switch (event.type) {
      case 'response.audio_transcript.delta':
        setCurrentTranscript(prev => prev + event.delta);
        onSpeakingChange(true);
        break;

      case 'response.audio_transcript.done':
        if (currentTranscript) {
          setMessages(prev => [...prev, { role: 'assistant', content: currentTranscript }]);
          setCurrentTranscript('');
        }
        onSpeakingChange(false);
        break;

      case 'conversation.item.input_audio_transcription.completed':
        if (event.transcript) {
          setMessages(prev => [...prev, { role: 'user', content: event.transcript }]);
        }
        break;

      case 'response.function_call_arguments.done':
        if (event.name === 'submit_inquiry') {
          try {
            const args = JSON.parse(event.arguments);
            console.log('Submitting inquiry:', args);
          } catch (err) {
            console.error('Error parsing function arguments:', err);
          }
        }
        break;

      case 'error':
        console.error('Realtime API error:', event);
        toast({
          title: 'Error',
          description: event.error?.message || 'An error occurred',
          variant: 'destructive',
        });
        break;
    }
  };

  const startConversation = async () => {
    setIsConnecting(true);
    try {
      chatRef.current = new RealtimeChat(handleMessage);
      await chatRef.current.init();
      setIsConnected(true);
      setMessages([]);
      toast({
        title: 'Connected',
        description: 'Alex is ready to help you',
      });
    } catch (error) {
      console.error('Error starting conversation:', error);
      toast({
        title: 'Connection Error',
        description: error instanceof Error ? error.message : 'Failed to start conversation',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const endConversation = () => {
    chatRef.current?.disconnect();
    setIsConnected(false);
    onSpeakingChange(false);
    setCurrentTranscript('');
    toast({
      title: 'Call Ended',
      description: 'Thank you for using Hospitrade AI',
    });
  };

  useEffect(() => {
    return () => {
      chatRef.current?.disconnect();
    };
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-card rounded-2xl shadow-sm border border-border p-6 min-h-[380px] max-h-[480px] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4 text-foreground">Conversation with Alex</h2>

        {messages.length === 0 && !isConnected && (
          <div className="text-center text-muted-foreground py-12">
            <Phone className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium mb-2">Ready when you are</p>
            <p className="text-sm">Click "Start Call" to speak with Alex about Hospitrade products</p>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl ${
                msg.role === 'user'
                  ? 'bg-primary/10 ml-8 text-foreground'
                  : 'bg-secondary/10 mr-8 text-foreground'
              }`}
            >
              <div className="font-semibold mb-1 text-sm">
                {msg.role === 'user' ? 'You' : 'Alex (Hospitrade AI)'}
              </div>
              <div className="text-sm leading-relaxed">{msg.content}</div>
            </div>
          ))}

          {currentTranscript && (
            <div className="p-4 rounded-xl bg-secondary/10 mr-8 text-foreground animate-pulse">
              <div className="font-semibold mb-1 text-sm flex items-center gap-2">
                Alex (Hospitrade AI)
                <Mic className="w-4 h-4 animate-pulse text-secondary" />
              </div>
              <div className="text-sm leading-relaxed">{currentTranscript}</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="flex justify-center">
        {!isConnected ? (
          <Button
            onClick={startConversation}
            disabled={isConnecting}
            size="lg"
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white px-10 py-6 text-lg rounded-full shadow-lg"
          >
            <Phone className="mr-2 h-5 w-5" />
            {isConnecting ? 'Connecting to Alex...' : 'Start Call with Alex'}
          </Button>
        ) : (
          <Button
            onClick={endConversation}
            size="lg"
            variant="destructive"
            className="px-10 py-6 text-lg rounded-full"
          >
            <PhoneOff className="mr-2 h-5 w-5" />
            End Call
          </Button>
        )}
      </div>
    </div>
  );
};

export default VoiceInterface;
