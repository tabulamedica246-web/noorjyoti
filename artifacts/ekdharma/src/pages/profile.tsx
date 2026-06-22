import { useGetMyPreferences, useUpdateMyPreferences, useListLanguages, useListVoices } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";

export default function Profile() {
  const { data: prefs, isLoading: prefsLoading } = useGetMyPreferences();
  const { data: languages } = useListLanguages();
  const { data: voices } = useListVoices();
  const updatePrefs = useUpdateMyPreferences();

  const handleLangChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updatePrefs.mutate({ data: { defaultLanguage: e.target.value } });
  };

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updatePrefs.mutate({ data: { defaultVoice: e.target.value } });
  };

  return (
    <div className="flex-1 p-6 animate-in fade-in duration-500">
      <h2 className="font-display text-2xl text-secondary tracking-widest mb-8 text-center">Sanctuary Settings</h2>

      {prefsLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-16 bg-card border border-primary/10 rounded-xl" />
          <Skeleton className="h-16 bg-card border border-primary/10 rounded-xl" />
        </div>
      ) : (
        <div className="space-y-8">
          <div className="space-y-3">
            <Label className="font-sans text-xs uppercase tracking-widest text-muted-foreground">Default Language</Label>
            <div className="relative">
              <select 
                value={prefs?.defaultLanguage || 'en'} 
                onChange={handleLangChange}
                className="w-full bg-card border border-primary/20 rounded-xl p-4 font-sans text-foreground appearance-none focus:outline-none focus:border-primary/50 transition-colors"
              >
                {languages?.map(l => (
                  <option key={l.code} value={l.code}>{l.nativeName} ({l.name})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="font-sans text-xs uppercase tracking-widest text-muted-foreground">Preferred Voice</Label>
            <div className="relative">
              <select 
                value={prefs?.defaultVoice || 'female_warm'} 
                onChange={handleVoiceChange}
                className="w-full bg-card border border-primary/20 rounded-xl p-4 font-sans text-foreground appearance-none focus:outline-none focus:border-primary/50 transition-colors"
              >
                {voices?.map(v => (
                  <option key={v.id} value={v.id}>{v.label} ({v.gender})</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
