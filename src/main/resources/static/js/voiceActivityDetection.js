
let audioContext;
let mediaStreamSource;
let meter;
let micStream
const micVolumeIcon = document.getElementById("mic-volume-icon");

const startVoiceActivity = (audio) => {
	micStream = new MediaStream();
	micStream.addTrack(audio.track);
	audioContext = new (window.AudioContext || window.webkitAudioContext)();
	
	mediaStreamSource = audioContext.createMediaStreamSource(micStream);
	meter = createAudioMeter(audioContext);
	mediaStreamSource.connect(meter);
};

// メーターの生成
function createAudioMeter(audioContext) {
  // メーターの生成
  const processor = audioContext.createScriptProcessor(512)
  processor.onaudioprocess = volumeAudioProcess
  processor.clipping = false
  processor.lastClip = 0
  processor.volume = 0
  processor.clipLevel = 0.98
  processor.averaging = 0.95
  processor.clipLag = 750
  processor.connect(audioContext.destination)

  // クリップチェック時に呼ばれる
  processor.checkClipping = function() {
    if (!this.clipping) {
      return false
    }
    if ((this.lastClip + this.clipLag) < window.performance.now()) {
      this.clipping = false
    }
    return this.clipping
  }

  // シャットダウン時に呼ばれる
  processor.shutdown = function() {
    this.disconnect()
    this.onaudioprocess = null
  }

  return processor
}

// オーディオ処理時に呼ばれる
function volumeAudioProcess(event) {
  const buf = event.inputBuffer.getChannelData(0)
  const bufLength = buf.length
  let sum = 0
  let x

  // 平均ボリュームの計算
  for (var i = 0; i < bufLength; i++) {
    x = buf[i]
    if (Math.abs(x) >= this.clipLevel) {
        this.clipping = true
        this.lastClip = window.performance.now()
    }
    sum += x * x
  }
  const rms = Math.sqrt(sum / bufLength)
  this.volume = Math.max(rms, this.volume * this.averaging)
 
  // ボリュームの表示
  let volume = this.volume.toFixed(4);
  if(volume >= 0.04) {
	micVolumeIcon.style.opacity = 1;	
  } else if(volume > 0.02 && volume < 0.04) {
	micVolumeIcon.style.opacity = 0.5;
  } else {
	micVolumeIcon.style.opacity = 0;	
  }
}