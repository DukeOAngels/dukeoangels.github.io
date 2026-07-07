import os
import shutil
import yt_dlp

def main():
    print("==================================================")
    print("    YouTube & YT Music M4A Bulk Downloader Tool   ")
    print("==================================================")
    
    # Pre-flight check for ffmpeg dependency
    if not shutil.which("ffmpeg"):
        print("\n⚠️  Warning: 'ffmpeg' dependency not found on your system path.")
        print("Metadata embedding and thumbnail cropping may fail.")
        print("Please ensure ffmpeg is installed.\n")

    while True:
        output_folder = input("Music Directory: ").strip()
        if not output_folder:
            print("Path cannot be empty. Please try again.\n")
            continue
        try:
            if not os.path.exists(output_folder):
                os.makedirs(output_folder)
            break
        except Exception as e:
            print(f"Invalid directory path or permission error: {e}. Please try again.\n")

    print(f"\n📂 Target directory set to: {output_folder}")
    print("Type 'q' at any time and press Enter to exit the tool.\n")

    while True:
        print("-" * 50)
        url = input("Paste YouTube / YT Music URL (or type 'q' to quit):\n> ").strip()
        
        if url.lower() == 'q':
            print("\nExiting downloader. Enjoy your music!")
            break
            
        if not url:
            print("Warning: URL input was empty. Please paste a valid link.")
            continue

        ydl_opts = {
            'format': 'bestaudio[ext=m4a]/bestaudio',
            'outtmpl': os.path.join(output_folder, '%(title)s.%(ext)s'),
            'writethumbnail': True,
            'quiet': False,
            'postprocessors': [
                {
                    'key': 'FFmpegMetadata',
                    'add_metadata': True,
                },
                {
                    'key': 'EmbedThumbnail',
                    'already_have_thumbnail': False,
                },
                {
                    # This tells yt-dlp to clean up the external thumbnail file after embedding
                    'key': 'FFmpegThumbnailsConvertor',
                    'format': 'jpg',
                    'when': 'before_dl'
                }
            ],
            'postprocessor_args': {
                'EmbedThumbnail+ffmpeg_o': ['-c:v', 'mjpeg', '-vf', 'crop=ih:ih'],
            },
        }

        print("\n📥 Fetching audio stream and embedding square cover art...")
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])
            print("✅ Success! File saved and metadata embedded.")
        except Exception as e:
            print(f"❌ An error occurred during download: {e}")
        print()

if __name__ == "__main__":
    main()
