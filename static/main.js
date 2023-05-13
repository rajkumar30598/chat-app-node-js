const socket = io("/");
const main__chat__window = document.getElementById("main__chat_window");
const videoGrids = document.getElementById("video-grids");
const screenElem = document.getElementById("share_screen");
const myVideo = document.createElement("video");
const chat = document.getElementById("chat");

OtherUsername = "";
chat.hidden = true;
myVideo.muted = true;

let myVideoStream;
const peers = {};
var getUserMedia =
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia;

var peer = new Peer(undefined, {
  path: "/peerjs",
  host: "/",
  port: "3030",
});

// Invite Dialog cancel button
const cancel = () => {
  $("#getCodeModal").modal("hide");
};

// Invite Dialog Copy button
const copy = async () => {
  const roomid = document.getElementById("roomid").innerText;
  await navigator.clipboard.writeText(window.location.href);
};

// Invite Dialog Trigger Function
const invitebox = () => {
  $("#getCodeModal").modal("show");
};

// To get access audio and video and stream
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream, myname);

    socket.on("user-connected", (id, username) => {
      console.log("userid:" + id);
      connectToNewUser(id, stream, username);
      socket.emit("tellName", myname);
    });

    socket.on("user-disconnected", (id) => {
      console.log(peers);
      if (peers[id]) peers[id].close();
    });
  });

// Send Message
sendmessage = (text) => {
  if (event.key === "Enter" && text.value != "") {
    socket.emit("messagesend", myname + " : " + text.value);
    text.value = "";
    main__chat_window.scrollTop = main__chat_window.scrollHeight;
  }
};

// Peer connection
peer.on("call", (call) => {
  getUserMedia(
    { video: true, audio: true },
    function (stream) {
      call.answer(stream); // Answer the call with an A/V stream.
      const video = document.createElement("video");
      call.on("stream", function (remoteStream) {
        addVideoStream(video, remoteStream, OtherUsername);
      });
    },
    function (err) {
      console.log("Failed to get local stream", err);
    }
  );
});

peer.on("open", (id) => {
  socket.emit("join-room", roomId, id, myname);
});

// Socket Emit if Message created
socket.on("createMessage", (message) => {
  var ul = document.getElementById("messageadd");
  var li = document.createElement("li");
  li.className = "message";
  li.appendChild(document.createTextNode(message));
  ul.appendChild(li);
});

// Socket Emit if Message Name Added
socket.on("AddName", (username) => {
  OtherUsername = username;
  console.log(username);
});

// Audio Mute Toggle
const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    document.getElementById("mic").style.color = "red";
  } else {
    document.getElementById("mic").style.color = "white";
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
};

// Video Mute Toggle
const VideomuteUnmute = () => {
  const enabled = myVideoStream.getVideoTracks()[0].enabled;
  console.log(getUserMedia);
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    document.getElementById("video").style.color = "red";
  } else {
    document.getElementById("video").style.color = "white";
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
};

// Chat Side UI Toggle
const showchat = () => {
  if (chat.hidden == false) {
    chat.hidden = true;
  } else {
    chat.hidden = false;
  }
};

//New  Video Connection
const connectToNewUser = (userId, streams, myname) => {
  const call = peer.call(userId, streams);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    //       console.log(userVideoStream);
    addVideoStream(video, userVideoStream, myname);
  });
  call.on("close", () => {
    video.remove();
    RemoveUnusedDivs();
  });
  peers[userId] = call;
};

// Establish Video Connection
const addVideoStream = (videoEl, stream, name) => {
  videoEl.srcObject = stream;
  videoEl.addEventListener("loadedmetadata", () => {
    videoEl.play();
  });
  const h1 = document.createElement("h1");
  const h1name = document.createTextNode(name);
  h1.appendChild(h1name);
  const videoGrid = document.createElement("div");
  videoGrid.classList.add("video-grid");
  videoGrid.appendChild(h1);
  videoGrids.appendChild(videoGrid);
  videoGrid.append(videoEl);
  RemoveUnusedDivs();
  let totalUsers = document.getElementsByTagName("video").length;
  if (totalUsers > 1) {
    for (let index = 0; index < totalUsers; index++) {
      document.getElementsByTagName("video")[index].style.width =
        100 / totalUsers + "%";
    }
  }
};

// If user leave remove that div
const RemoveUnusedDivs = () => {
  //
  alldivs = videoGrids.getElementsByTagName("div");
  for (var i = 0; i < alldivs.length; i++) {
    e = alldivs[i].getElementsByTagName("video").length;
    if (e == 0) {
      alldivs[i].remove();
    }
  }
};

//share screen
const startCapture = async () => {
  try {
    const ss_screen = document.getElementById("share_screen_section");
    const start = document.getElementById("start-ss");
    const stop = document.getElementById("stop-ss");
    var displayMediaOptions = {
      video: {
        cursor: "always",
        height: 1000,
        width: 1200,
      },
      audio: false,
    };
    screenElem.srcObject = await navigator.mediaDevices.getDisplayMedia(
      displayMediaOptions
    );
    ss_screen.style.display = "flex";
    start.style.display = "none";
    stop.style.display = "block";
  } catch (err) {
    console.error("Error: " + err);
  }
};

const stopCapture = (evt) => {
  const ss_screen = document.getElementById("share_screen_section");
  const start = document.getElementById("start-ss");
  const stop = document.getElementById("stop-ss");

  let tracks = screenElem.srcObject.getTracks();
  tracks.forEach((track) => track.stop());
  screenElem.srcObject = null;

  ss_screen.style.display = "none";
  start.style.display = "block";
  stop.style.display = "none";
};
