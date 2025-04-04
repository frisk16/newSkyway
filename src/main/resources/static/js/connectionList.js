
const connectionList = document.getElementById("connection-list");
let memberList = [];

const setConnectionList = async (publisherId, videoFlg, micFlg) => {
	if(memberList.includes(publisherId)) {
		const videoImg = document.getElementById(`con-video-${publisherId}`);
		const micImg = document.getElementById(`con-mic-${publisherId}`);
		if(videoFlg != null) videoImg.src = videoFlg ? "/img/on_video.png" : "/img/off_video.png";
		if(micFlg != null) micImg.src = micFlg ? "/img/on_mic.png" : "/img/off_mic.png";
	} else {
		memberList.push(publisherId);
		createListElements(publisherId, videoFlg, micFlg);		
	}
};

const deleteConnectionList = (meId, publisherId) => {
	if(meId != null) {
		connectionList.replaceChildren();
		memberList = [];
	}
	if(publisherId != null) {
		document.getElementById(`member-${publisherId}`).remove();
		memberList = memberList.filter(list => list != publisherId);
	}
};


const createListElements = (publisherId, videoFlg, micFlg) => {
	const slicePublisherId = publisherId.slice(0, 5)+"...";
	const memberArea = document.createElement("div");
	memberArea.id = `member-${publisherId}`;
	memberArea.classList.add("d-flex", "align-items-center", "gap-3", "mb-3");

	const memberId = document.createElement("span");
	memberId.textContent = slicePublisherId;
	memberId.classList.add("me-auto");
	memberArea.appendChild(memberId);

	const videoImg = document.createElement("img");
	videoImg.setAttribute("width", "20px");
	videoImg.setAttribute("height", "20px");
	videoImg.src = videoFlg ? "/img/on_video.png" : "/img/off_video.png";
	videoImg.id = `con-video-${publisherId}`;
	memberArea.appendChild(videoImg);
	
	const micImg = document.createElement("img");
	micImg.setAttribute("width", "20px");
	micImg.setAttribute("height", "20px");
	micImg.src = micFlg ? "/img/on_mic.png" : "/img/off_mic.png";
	micImg.id = `con-mic-${publisherId}`;
	memberArea.appendChild(micImg);
	
	connectionList.appendChild(memberArea);
};
