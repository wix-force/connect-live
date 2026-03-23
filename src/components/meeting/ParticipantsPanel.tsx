import { Mic, MicOff, Hand, Crown, UserMinus, Volume2, Video, VideoOff, Monitor } from 'lucide-react';
import { useAppSelector } from '@/store';

interface ParticipantsPanelProps {
  onMuteParticipant?: (socketId: string) => void;
  onRemoveParticipant?: (socketId: string) => void;
}

export default function ParticipantsPanel({ onMuteParticipant, onRemoveParticipant }: ParticipantsPanelProps = {}) {
  const participants = useAppSelector(s => s.participants.participants);
  const isHost = useAppSelector(s => s.meeting.isHost);

  const raisedHands = participants.filter(p => p.isHandRaised);
  const others = participants.filter(p => !p.isHandRaised);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-foreground">People ({participants.length})</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* Raised hands section */}
        {raisedHands.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-meet-warning px-3 py-1.5 flex items-center gap-1.5">
              <Hand className="w-3.5 h-3.5" />
              Raised hands ({raisedHands.length})
            </p>
            {raisedHands.map(p => (
              <ParticipantRow
                key={p.id}
                participant={p}
                isHost={isHost}
                onMute={onMuteParticipant}
                onRemove={onRemoveParticipant}
              />
            ))}
          </div>
        )}

        {/* All participants */}
        {others.map(p => (
          <ParticipantRow
            key={p.id}
            participant={p}
            isHost={isHost}
            onMute={onMuteParticipant}
            onRemove={onRemoveParticipant}
          />
        ))}
      </div>
    </div>
  );
}

function ParticipantRow({
  participant: p,
  isHost,
  onMute,
  onRemove,
}: {
  participant: any;
  isHost: boolean;
  onMute?: (id: string) => void;
  onRemove?: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/50 transition-colors group">
      <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary flex-shrink-0 relative">
        {p.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
        {p.isSpeaking && (
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-meet-success border-2 border-card" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-medium text-foreground truncate">{p.name}</span>
          {p.isHost && <Crown className="w-3.5 h-3.5 text-meet-warning flex-shrink-0" />}
        </div>
        {p.isScreenSharing && (
          <span className="text-[10px] text-primary flex items-center gap-1 mt-0.5">
            <Monitor className="w-3 h-3" /> Presenting
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        {p.isHandRaised && (
          <span className="w-6 h-6 rounded-full bg-meet-warning/20 flex items-center justify-center">
            <Hand className="w-3.5 h-3.5 text-meet-warning" />
          </span>
        )}
        {p.isCameraOff ? (
          <VideoOff className="w-3.5 h-3.5 text-muted-foreground" />
        ) : (
          <Video className="w-3.5 h-3.5 text-muted-foreground" />
        )}
        {p.isMuted ? (
          <MicOff className="w-4 h-4 text-meet-danger" />
        ) : (
          <Mic className="w-4 h-4 text-muted-foreground" />
        )}
        {/* Host controls */}
        {isHost && !p.isHost && (
          <div className="hidden group-hover:flex items-center gap-1 ml-1">
            <button
              onClick={() => onMute?.(p.id)}
              className="p-1 rounded hover:bg-destructive/10"
              aria-label={`Mute ${p.name}`}
            >
              <Volume2 className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <button
              onClick={() => onRemove?.(p.id)}
              className="p-1 rounded hover:bg-destructive/10"
              aria-label={`Remove ${p.name}`}
            >
              <UserMinus className="w-3.5 h-3.5 text-destructive" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
