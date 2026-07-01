import { initializeApp }
from "https://www.gstatic.com/firebasejs/12.14.0/firebase-app.js";

import {
    getAuth,
    GoogleAuthProvider,
    GithubAuthProvider,
    signInWithPopup
}
from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

const firebaseConfig = {

    apiKey: "AIzaSyBOqCzXxGpUCSPkpeWeK3XYE7CR3vebBnU",

    authDomain: "led-panel-control.firebaseapp.com",

    projectId: "led-panel-control",

    storageBucket: "led-panel-control.firebasestorage.app",

    messagingSenderId: "283591978012",

    appId: "1:283591978012:web:496523bd245806224043d9",

    measurementId: "G-2T2SJ2W2LG"

};

const app =
initializeApp(firebaseConfig);

const auth =
getAuth(app);

/* ======================
   GOOGLE LOGIN
====================== */

window.googleLogin =
async function(){

    try{

        const provider =
        new GoogleAuthProvider();

        const result =
        await signInWithPopup(
            auth,
            provider
        );

        const user =
        result.user;
        
        // CLOUD UPDATE: Changed to relative path
        await fetch(
    "/save-user",
{
    method:"POST",

    headers:{
        "Content-Type":
        "application/json"
    },

    body: JSON.stringify({

        uid:user.uid,

        name:user.displayName,

        email:user.email

    })
   }
);
        localStorage.setItem(
            "userEmail",
            user.email
        );

        localStorage.setItem(
            "userName",
            user.displayName
        );
        localStorage.setItem(
              "userUID",
             user.uid
        );

        alert(
            "Welcome " +
            user.displayName
        );

        window.location.href =
        "upload.html";

    }

    catch(error){

        console.log(error);

        alert(
            error.code +
            "\n" +
            error.message
        );

    }

};

/* ======================
   GITHUB LOGIN
====================== */

window.githubLogin =
async function(){

    try{

        const provider =
        new GithubAuthProvider();

        const result =
        await signInWithPopup(
            auth,
            provider
        );

        const user =
        result.user;

        localStorage.setItem(
            "userEmail",
            user.email || "githubuser"
        );

        localStorage.setItem(
            "userName",
            user.displayName || user.uid
        );
        localStorage.setItem(
    "userUID",
    user.uid
);

// CLOUD UPDATE: Changed to relative path
await fetch(
    "/save-user",
{
    method:"POST",

    headers:{
        "Content-Type":
        "application/json"
    },

    body: JSON.stringify({

        uid:user.uid,

        name:user.displayName || user.uid,

        email:user.email || "githubuser"

    })
   }
);
        alert(
            "Welcome " +
            (user.displayName || "GitHub User")
        );

        window.location.href =
        "upload.html";

    }

    catch(error){

        console.log(error);

        alert(
            error.code +
            "\n" +
            error.message
        );

    }

};