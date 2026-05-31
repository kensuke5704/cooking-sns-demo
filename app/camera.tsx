import { useRef, useState } from "react";

export default function CameraPost() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsCameraOn(true);
    } catch (error) {
      alert("カメラを起動できませんでした。ブラウザのカメラ許可を確認してください。");
      console.error(error);
    }
  };

  const takePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL("image/jpeg", 0.9);
    setPhoto(imageData);
    stopCamera();
  };

  const stopCamera = () => {
    const video = videoRef.current;

    if (video?.srcObject) {
      const stream = video.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    }

    setIsCameraOn(false);
  };

  const retakePhoto = () => {
    setPhoto(null);
    startCamera();
  };

  const postPhoto = () => {
    if (!photo) return;

    // ここで投稿処理に接続
    console.log("投稿する画像:", photo);

    alert("投稿しました！");
    setPhoto(null);
  };

  return (
    <div className="w-full min-h-screen bg-[#fff8dc] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-4">
        <h2 className="text-xl font-bold text-center mb-4">
          今日の料理を撮影
        </h2>

        {!isCameraOn && !photo && (
          <button
            onClick={startCamera}
            className="w-full bg-[#ffcf33] text-black font-bold py-3 rounded-2xl"
          >
            カメラを起動する
          </button>
        )}

        {isCameraOn && (
          <>
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full rounded-2xl bg-black"
            />

            <button
              onClick={takePhoto}
              className="w-full mt-4 bg-black text-white font-bold py-3 rounded-2xl"
            >
              撮影する
            </button>

            <button
              onClick={stopCamera}
              className="w-full mt-2 bg-gray-200 text-black py-3 rounded-2xl"
            >
              キャンセル
            </button>
          </>
        )}

        {photo && (
          <>
            <img
              src={photo}
              alt="撮影した料理"
              className="w-full rounded-2xl"
            />

            <textarea
              placeholder="ひとことを書く"
              className="w-full mt-4 border rounded-2xl p-3"
            />

            <button
              onClick={postPhoto}
              className="w-full mt-4 bg-[#ffcf33] text-black font-bold py-3 rounded-2xl"
            >
              投稿する
            </button>

            <button
              onClick={retakePhoto}
              className="w-full mt-2 bg-gray-200 text-black py-3 rounded-2xl"
            >
              撮り直す
            </button>
          </>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}