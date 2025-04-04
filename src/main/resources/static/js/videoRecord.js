
let mediaData = [];
let options = {};
let mediaRecorder = null;

const startRecording = (stream) => {
	options = setRecordOptions();
	
	document.getElementById("start-record-btn").classList.add("d-none");
	document.getElementById("start-record-btn").classList.remove("d-block");
	document.getElementById("stop-record-btn").classList.add("d-block");
	document.getElementById("stop-record-btn").classList.remove("d-none");
	
	mediaRecorder = new MediaRecorder(stream, options);
	mediaRecorder.start();
	
	mediaRecorder.ondataavailable = (e) => {
		if(e.data && e.data.size > 0) {
			mediaData.push(e.data);
		}
	};	
};

const stopRecording = () => {
	mediaRecorder.onstop = () => {
		mediaRecorder.stop();
		
		let extType = "";
		let fileName = "";
		if (MediaRecorder.isTypeSupported('video/webm; codecs=vp9')) {
			extType = "video/webm";
			fileName = "testRecord.webm";
		} else  if (MediaRecorder.isTypeSupported('video/webm')) {
			extType = "video/webm";
			fileName = "testRecord.webm";
		} else if (MediaRecorder.isTypeSupported('video/mp4')) {
			extType = "video/mp4";
			fileName = "testRecord.mp4";
		} else {
			console.error("no suitable mimetype found for this device");
		}
		
		const blob = new Blob(mediaData, {type: extType});
		const downloadBtn = document.createElement("a");
		downloadBtn.classList.add("btn", "btn-sm", "btn-success");
		downloadBtn.href = URL.createObjectURL(blob);
		downloadBtn.target = "_blank";
		downloadBtn.textContent = "download";
		downloadBtn.download = fileName;
		document.getElementById("record-btn-area").appendChild(downloadBtn);
	};
};

const setRecordOptions = () => {
	if (MediaRecorder.isTypeSupported('video/webm; codecs=vp9')) {
		return {  audioBitsPerSecond: 64000, videoBitsPerSecond: 320000,mimeType: 'video/webm; codecs=vp9'};
	} else  if (MediaRecorder.isTypeSupported('video/webm')) {
		return { audioBitsPerSecond: 64000, videoBitsPerSecond: 320000 ,mimeType: 'video/webm'};
	} else if (MediaRecorder.isTypeSupported('video/mp4')) {
		return {  audioBitsPerSecond: 64000, videoBitsPerSecond: 320000,mimeType: 'video/mp4'};
	} else {
		console.error("no suitable mimetype found for this device");
	}
};
