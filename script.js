alert("NEW SCRIPT LOADED");
window.addEventListener("beforeunload", function () {
    console.log("PAGE IS RELOADING");
});
window.addEventListener("load", function () {
    console.log("PAGE LOADED");
});
/* ==========================
   STORAGE SETTINGS
========================== */

let storageUsed = 0;
const storageLimit = 5;


/* ==========================
   LOGIN
========================== */

function login() {

    let password =
    document.getElementById("password").value;

    let message =
    document.getElementById("message");

    if (password === "led123") {

        window.location.href =
        "upload.html";

    }

    else {

        message.innerHTML =
        "❌ Access Denied! Incorrect Password";

    }

}


/* ==========================
   IMAGE UPLOAD
========================== */

function previewImage(event){
    alert("FUNCTION START");

    console.log("FUNCTION START");
    console.clear();

    console.log("STEP 1");
     document.getElementById("previewImage").style.display = "block";
    console.log(event);
    console.log("PREVIEW FUNCTION CALLED");
    document.getElementById("previewImage").style.display = "block";
     console.log("FUNCTION START");
     console.log("previewImage called");
    let file =
    event.target.files[0];
    console.log("File =", file);


    if(!file){
    return;
}
    if(file.type==="image/gif"){

    localStorage.setItem(
        "contentType",
        "gif"
    );

}
else{

    localStorage.setItem(
        "contentType",
        "image"
    );

}
    

    if(!file){
        return;
    }

    let fileSizeMB =
    file.size / (1024 * 1024);

    /* STORAGE LIMIT CHECK */

    if(
        storageUsed + fileSizeMB >
        storageLimit
    ){

        alert(
            "Storage Limit Reached!\nMaximum 5 MB allowed."
        );

        document.getElementById(
            "fileInput"
        ).value = "";

        return;
    }

    /* IMAGE RESOLUTION */

    let img =
    new Image();

    img.onload = function(){

        localStorage.setItem(
            "imageWidth",
            img.width
        );

        localStorage.setItem(
            "imageHeight",
            img.height
        );

    };

    img.src =
    URL.createObjectURL(file);

    /* UPDATE STORAGE */

    storageUsed =
    storageUsed + fileSizeMB;

    localStorage.setItem(
        "storageUsed",
        storageUsed.toFixed(2)
    );

    let percent =
    (storageUsed / storageLimit)
    * 100;

    let progress =
    document.getElementById(
        "progressFill"
    );

    if(progress){

        progress.style.width =
        percent + "%";
    }

    let storageText =
    document.getElementById(
        "storageText"
    );

    if(storageText){

        storageText.innerHTML =
        storageUsed.toFixed(2)
        + " MB / 5 MB Used";
    }

    /* IMAGE PREVIEW */

    let reader =
    new FileReader();

    reader.onload = function(e){
        console.log("PREVIEW CREATED");
        localStorage.setItem(
            "uploadedImage",
            e.target.result
        );

        localStorage.setItem(
            "fileName",
            file.name
        );

        document.getElementById(
            "fileName"
        ).innerHTML =
        "Selected File: "
        + file.name;

        let image =
        document.getElementById(
            "previewImage"
        );

        if(image){

            image.src =
            e.target.result;

            image.style.display =
            "block";
             console.log("IMAGE SRC =", image.src);
        }
        document.getElementById(
            "nextBtn"
        ).disabled = false;
    };
const formData = new FormData();

formData.append("file", file);

formData.append(
    "uid",
    localStorage.getItem("userUID")
);

formData.append(
    "userName",
    localStorage.getItem("userName")
);

formData.append(
    "userEmail",
    localStorage.getItem("userEmail")
);

console.log("STEP 2 BEFORE FETCH");
console.log("BEFORE FETCH");
alert("BEFORE FETCH");

// CLOUD UPDATE: Changed to relative path
fetch("/upload", {
    method: "POST",
    body: formData
})
.then(async (res) => {

    const text = await res.text();

    const data = JSON.parse(text);

    console.log("UPLOAD SUCCESS =", data);

    if(data.media){

        localStorage.setItem(
            "mediaId",
            data.media.id
        );

        console.log(
            "MEDIA ID SAVED =",
            data.media.id
        );
    }

})
.catch(err => {

    console.log("ERROR =", err);

});



    reader.readAsDataURL(file);

}


/* ==========================
   TEXT PREVIEW
========================== */

function updatePreview() {

    let text =
    document.getElementById(
        "textInput"
    ).value;

    if(text === ""){

        text =
        "HELLO LED WORLD!";
    }

    document.getElementById(
        "previewBox"
    ).innerHTML =
    text;

    localStorage.setItem(
        "displayText",
        text
    );

}


/* ==========================
   TEXT SCALE
========================== */

function updateScale() {

    let scale =
    document.getElementById(
        "textScale"
    ).value;

    let fontSize = 20;

    if(scale == 1) fontSize = 20;
    if(scale == 2) fontSize = 30;
    if(scale == 3) fontSize = 40;
    if(scale == 4) fontSize = 50;
    if(scale == 5) fontSize = 60;

    document.getElementById(
        "previewBox"
    ).style.fontSize =
    fontSize + "px";

    localStorage.setItem(
        "textScale",
        scale
    );

}


/* ==========================
   TEXT COLOUR
========================== */

function changeTextColor(color) {

    document.getElementById(
        "previewBox"
    ).style.color =
    color;

    localStorage.setItem(
        "textColor",
        color
    );

}


/* ==========================
   BACKGROUND COLOUR
========================== */

function changeBackground(color) {

    document.getElementById(
        "previewBox"
    ).style.background =
    color;

    localStorage.setItem(
        "bgColor",
        color
    );

}
let userInfo =
document.getElementById("userInfo");

if(userInfo){

    userInfo.innerHTML =
    "Logged in as: " +
    localStorage.getItem("userEmail");
}
function previewVideo(event){
    alert("Function chal gaya");
    let file = event.target.files[0];
    let fileSizeMB =
file.size / (1024 * 1024);
localStorage.setItem(
    "storageUsed",
    fileSizeMB.toFixed(2)
);
let storageText =
document.getElementById(
    "storageText"
);

if(storageText){

    storageText.innerHTML =
    fileSizeMB.toFixed(2)
    + " MB / 5 MB Used";
    let percent =
(fileSizeMB / 5) * 100;

document.getElementById(
    "progressFill"
).style.width =
percent + "%";
}
    if(!file) return;
     localStorage.setItem(
        "contentType",
        "video"
    );
    let reader = new FileReader();

    reader.onload = function(e){

        localStorage.setItem(
            "uploadedVideo",
            e.target.result
        );

        document.getElementById(
            "fileName"
        ).innerHTML =
        "Selected File: " + file.name;

        let video =
        document.getElementById(
            "previewVideo"
        );

        video.src =
        e.target.result;

        video.style.display =
        "block";
    };
    const formData = new FormData();
formData.append("file", file);

// CLOUD UPDATE: Changed to relative path
fetch("/upload", {
    method: "POST",
    body: formData
})
.then(res => res.json())
.then(data => {

    console.log("Uploaded:", data);

    // CLOUD UPDATE: Removed hardcoded localhost
    localStorage.setItem(
        "uploadedImage",
        "/" + data.media.filePath.replace(/\\/g, "/")
    );

    // preview ko same rakho
    document.getElementById("fileName").innerHTML =
        "Selected File: " + file.name;

    document.getElementById("previewImage").style.display =
        "block";

    document.getElementById("nextBtn").disabled =
        false;

})
.catch(err => {

    console.error("FULL ERROR =", err);

    alert("Upload Failed");

});
    reader.readAsDataURL(file);
}
async function logout(){

    // CLOUD UPDATE: Changed to relative path
    await fetch(
        "/logout-log",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                uid: localStorage.getItem("userUID"),

                name: localStorage.getItem("userName"),

                email: localStorage.getItem("userEmail")

            })
        }
    );

    localStorage.clear();

    window.location.href =
    "index.html";
}
window.onload = function () {

    const savedImage =
    localStorage.getItem("uploadedImage");

    if(savedImage){

        const img =
        document.getElementById("previewImage");

        if(img){

            img.src = savedImage;
            img.style.display = "block";
        }
        // NEXT BUTTON ENABLE
        const nextBtn =
        document.getElementById("nextBtn");

        if(nextBtn){
            nextBtn.disabled = false;
        }

        // FILE NAME RESTORE
        const savedName =
        localStorage.getItem("fileName");

        if(savedName){
            document.getElementById("fileName").innerHTML =
            "Selected File: " + savedName;
        }
    }
    const savedStorage =
localStorage.getItem("storageUsed");

if(savedStorage){

    document.getElementById(
        "storageText"
    ).innerHTML =
    savedStorage +
    " MB / 5 MB Used";

    let percent =
    (parseFloat(savedStorage) / 5) * 100;

    document.getElementById(
        "progressFill"
    ).style.width =
    percent + "%";
}
};
async function publishMedia() {

    const mediaId =
    localStorage.getItem("mediaId");

    const userEmail =
    localStorage.getItem("userEmail");

    console.log("MEDIA ID =", mediaId);

    // CLOUD UPDATE: Changed to relative path
    const response = await fetch(
        "/publish-media",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                mediaId: mediaId,
                userEmail: userEmail

            })
        }
    );

    const data =
    await response.json();

    console.log(data);

    if(data.success){

        alert("Published Successfully ✅");

    }
}