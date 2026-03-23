import { useState, useEffect } from 'react';
import { X, Mic, Video as VideoIcon, Palette, Sparkles, Volume2 } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '@/store';
import { toggleBackgroundBlur, setSelectedMic, setSelectedCamera, setSelectedSpeaker, setDevices } from '@/store/slices/mediaSlice';
import { toggleTheme } from '@/store/slices/uiSlice';
import { useMediaDevices } from '@/hooks/useSocket';

const tabs = [
  { id: 'audio', label: 'Audio', icon: Mic },
  { id: 'video', label: 'Video', icon: VideoIcon },
  { id: 'appearance', label: 'Appearance', icon: Palette },
] as const;

interface DeviceInfo {
  id: string;
  label: string;
  kind: string;
}

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<string>('audio');
  const { isBackgroundBlur, selectedMic, selectedCamera, selectedSpeaker, devices: storeDevices } = useAppSelector(s => s.media);
  const dispatch = useAppDispatch();
  const { getDevices } = useMediaDevices();
  const [devices, setLocalDevices] = useState<DeviceInfo[]>([]);
  const [testingAudio, setTestingAudio] = useState(false);

  useEffect(() => {
    getDevices().then(d => {
      setLocalDevices(d);
      dispatch(setDevices(d.map(dev => ({ id: dev.id, label: dev.label, kind: dev.kind as MediaDeviceKind }))));
    });
  }, [getDevices, dispatch]);

  const mics = devices.filter(d => d.kind === 'audioinput');
  const cameras = devices.filter(d => d.kind === 'videoinput');
  const speakers = devices.filter(d => d.kind === 'audiooutput');

  const testSpeaker = () => {
    setTestingAudio(true);
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 440;
    gain.gain.value = 0.1;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    setTimeout(() => {
      osc.stop();
      ctx.close();
      setTestingAudio(false);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm" onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden animate-scale-in"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Settings</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-accent" aria-label="Close settings">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-border px-6">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm border-b-2 transition-colors ${
                activeTab === t.id
                  ? 'border-primary text-primary font-medium'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>

        <div className="p-6 space-y-5">
          {activeTab === 'audio' && (
            <>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Microphone</label>
                <select
                  value={selectedMic || ''}
                  onChange={e => dispatch(setSelectedMic(e.target.value))}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
                >
                  <option value="">Default Microphone</option>
                  {mics.map(d => (
                    <option key={d.id} value={d.id}>{d.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Speaker</label>
                <div className="flex gap-2">
                  <select
                    value={selectedSpeaker || ''}
                    onChange={e => dispatch(setSelectedSpeaker(e.target.value))}
                    className="flex-1 h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
                  >
                    <option value="">Default Speaker</option>
                    {speakers.map(d => (
                      <option key={d.id} value={d.id}>{d.label}</option>
                    ))}
                  </select>
                  <button
                    onClick={testSpeaker}
                    disabled={testingAudio}
                    className="h-10 px-3 rounded-lg border border-border bg-background hover:bg-accent text-sm text-foreground transition-colors disabled:opacity-50"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'video' && (
            <>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Camera</label>
                <select
                  value={selectedCamera || ''}
                  onChange={e => dispatch(setSelectedCamera(e.target.value))}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:ring-2 focus:ring-ring focus:outline-none"
                >
                  <option value="">Default Camera</option>
                  {cameras.map(d => (
                    <option key={d.id} value={d.id}>{d.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Background Blur</p>
                    <p className="text-xs text-muted-foreground">Blur your background during calls</p>
                  </div>
                </div>
                <button
                  onClick={() => dispatch(toggleBackgroundBlur())}
                  className={`w-11 h-6 rounded-full transition-colors relative ${isBackgroundBlur ? 'bg-primary' : 'bg-muted'}`}
                  aria-label="Toggle background blur"
                >
                  <div className={`w-5 h-5 rounded-full bg-card absolute top-0.5 transition-transform ${isBackgroundBlur ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </>
          )}

          {activeTab === 'appearance' && (
            <div className="flex items-center justify-between p-3 rounded-lg border border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Dark Mode</p>
                <p className="text-xs text-muted-foreground">Switch between light and dark</p>
              </div>
              <button
                onClick={() => {
                  dispatch(toggleTheme());
                  document.documentElement.classList.toggle('dark');
                }}
                className="px-4 py-2 rounded-lg bg-accent text-sm font-medium text-foreground hover:bg-accent/80 transition-colors"
              >
                Toggle
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
