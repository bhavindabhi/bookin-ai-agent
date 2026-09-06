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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
        if (event.name === 'save_appointment') {
          try {
            const args = JSON.parse(event.arguments);
            console.log('Appointment to save:', args);
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
      toast({ title: 'Connected', description: 'Sofia is ready to assist you' });
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
    toast({ title: 'Call Ended', description: 'Thank you for calling Complete Smiles!' });
  };

  useEffect(() => () => { chatRef.current?.disconnect(); }, []);

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      {/* Transcript */}
      <div className="bg-card rounded-2xl border border-border p-6 min-h-[360px] max-h-[460px] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
          <span className="text-xl">💬</span>
          Conversation with Sofia
        </h2>

        {messages.length === 0 && !isConnected && (
          <div className="text-center text-muted-foreground py-12">
            <div className="text-5xl mb-4">😊</div>
            <p className="text-lg font-medium mb-1">Sofia is standing by</p>
            <p className="text-sm">Click "Call Sofia" to book your appointment</p>
          </div>
        )}

        <div className="space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl ${
                msg.role === 'user'
                  ? 'bg-primary/10 ml-10 text-foreground'
                  : 'bg-secondary/10 mr-10 text-foreground'
              }`}
            >
              <div className="font-semibold mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                {msg.role === 'user' ? 'You' : 'Sofia — Complete Smiles AI'}
              </div>
              <div className="text-sm leading-relaxed">{msg.content}</div>
            </div>
          ))}

          {currentTranscript && (
            <div className="p-4 rounded-xl bg-secondary/10 mr-10 text-foreground">
              <div className="font-semibold mb-1 text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                Sofia — Complete Smiles AI
                <Mic className="w-3 h-3 animate-pulse text-secondary" />
              </div>
              <div className="text-sm leading-relaxed">{currentTranscript}</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center">
        {!isConnected ? (
          <Button
            onClick={startConversation}
            disabled={isConnecting}
            size="lg"
            className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white px-10 py-6 text-lg rounded-full shadow-lg"
          >
            <Phone className="mr-2 h-5 w-5" />
            {isConnecting ? 'Connecting to Sofia...' : 'Call Sofia'}
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
