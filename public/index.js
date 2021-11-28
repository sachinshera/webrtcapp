let roomid = document.querySelector(".roomId");
let gobtn = document.querySelector(".gobtn");
let localvideo = document.querySelector(".localVideo");
let remotevideo = document.querySelector(".remoteVideo");
let selectroom = document.querySelector(".selectRoom");
let roomcontent = document.querySelector(".roomcontent");

let roomNumber, localStream, remoteStream, rtcPeerConnection, isCaller;

const streamConstraints = {
    audio: true,
    video: true
}
const iceServer = {
    "servers": [
        { "urls": "stun:stun.services.mozilla.com" },
        { "urls": "stun:stun.l.google.com:19301" }
    ]
}
const socket = io();
gobtn.onclick = function () {
    if (roomid.value == "") {
        alert("room cannot be empty");
    } else {
        socket.emit("create join", roomid.value);
        roomcontent.style.display = "block";
        selectroom.style.display = "none";
    }
}

socket.on("created", room => {
    navigator.mediaDevices.getUserMedia(streamConstraints).then(stream => {
        localStream = stream;
        localvideo.srcObject = stream;
    }).catch(() => {
        alert("error on getting user media stream");
    })
})

socket.on("joined", room => {
    navigator.mediaDevices.getUserMedia(streamConstraints).then(stream => {
        localStream = stream;
        localvideo.srcObject = stream;
        socket.emit("ready", roomid.value);
    }).catch(() => {
        alert("error on getting user media stream");
    })
})

socket.on("ready", () => {
    if (isCaller) {
        rtcPeerConnection = new RTCPeerconnection(iceServer);
        rtcPeerConnection.onicecandidate = onIceCandidate;
        rtcPeerConnection.ontrach = onAddStream;
        rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream);
        rtcPeerConnection.addTracks(localStream.getTracks()[1], localStream);
        rtcPeerConnection.createOffer().ten(sessionDescription => {
            rtcPeerConnection.setLocalDescription(sessionDescription);
            socket.emit("offer", {
                type: "offer",
                sdp: sessionDescription,
                room: roomid.value
            })
        }).catch(() => {
            alert("error on rtc");
        })
    }
})


socket.on("offer", (event) => {
    if (!isCaller) {
        rtcPeerConnection = new RTCPeerconnection(iceServer);
        rtcPeerConnection.onicecandidate = onIceCandidate;
        rtcPeerConnection.ontrach = onAddStream;
        rtcPeerConnection.addTrack(localStream.getTracks()[0], localStream);
        rtcPeerConnection.addTracks(localStream.getTracks()[1], localStream);
        rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
        rtcPeerConnection.createAnswer().then(sessionDescription => {
            rtcPeerConnection.setLocalDescription(sessionDescription);
            socket.emit("answer", {
                type: "answer",
                sdp: sessionDescription,
                room: roomid.value
            })
        }).catch(() => {
            alert("error on rtc");
        })
    }
})
socket.on("answer", event => {
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
})
socket.on("candidate", event => {
    const candidate = new RTCIceCandidate({
        sdpMLineIndex: event.label,
        candidate: event.candidate
    });
    rtcPeerConnection.addIceCandidate(candidate);
})
function onAddStream(event) {
    remotevideo.srcObject = event.streams[0];
    remoteStream = event.streams[0];
}

function onIceCandidate(event) {
    if (event.candidate) {
        console.log("send in ice candidate");
        socket.emit("candidate", {
            type: "candidate",
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate,
            room: roomid.value
        });
    }
}