import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  size?: "sm" | "lg";
  editable?: boolean;
}

export function AvatarUpload({ size = "lg", editable = true }: Props) {
  const { profile, refreshProfile } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  if (!profile) return null;

  const dim = size === "lg" ? "w-20 h-20 text-2xl" : "w-14 h-14 text-xl";

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("الصورة يجب أن تكون أقل من 2 ميغابايت");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${profile.id}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${data.publicUrl}?t=${Date.now()}`;
      const { error: updErr } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", profile.id);
      if (updErr) throw updErr;
      await refreshProfile?.();
      toast.success("تم تحديث الصورة ✅");
    } catch (err: any) {
      toast.error("فشل رفع الصورة");
    }
    setUploading(false);
  };

  return (
    <div className="relative inline-block">
      <div className={`${dim} rounded-2xl bg-card border-4 border-card flex items-center justify-center font-bold gradient-primary text-primary-foreground glow-primary overflow-hidden`}>
        {profile.avatar_url ? (
          <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
        ) : (
          profile.name?.[0] || "؟"
        )}
      </div>
      {editable && (
        <>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -left-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
          </button>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </>
      )}
    </div>
  );
}
