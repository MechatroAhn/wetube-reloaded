import User from "../models/User";
import fetch from "node-fetch";
import bcrypt from "bcrypt";
import { application, urlencoded } from "express";

export const getJoin =(req, res) => res.render("join",{pageTitle: "Join"});

export const postJoin = async(req, res) => {
    const { name, username, email, password, password2, location } = req.body
    if(password !== password2){
        return res.status(400).render("join",{
            pageTitle: "Join",
            errorMessage: "Password confirmation does not match.",
        });
    }
    const exists = await User.exists({$or:[{username},{email}]});
    if(exists){
        return res.status(400).render("join",{
            pageTitle:"Join", 
            errorMessage:"This username/email is already taken.",
        });
    }
    try{
        await User.create({
            name, 
            username, 
            email, 
            password, 
            location,
        });
        res.redirect("/login");
    } catch(error){
        return res.status(400).render("join",{
            pageTitle: error, 
            errorMessage:error._message,
        });
    }
    
};

export const getLogin = (req, res) => {
    return res.render("login", {pageTitle: "Login"});
}

export const postLogin = async(req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({username, socialOnly: false});
    if(!user){
        return res.status(400).render("login",{
            pageTitle:"Login", 
            errorMessage:"An account with this username does not exist.",
        });
    }

    const ok = await bcrypt.compare(password, user.password);
    
    if(!ok){
        return res.status(400).render("login",{
            pageTitle:"Login", 
            errorMessage:"Wrong password",
        });
    } 
    req.session.loggedIn = true;
    req.session.user = user;
    return res.redirect("/");
};

export const startGithubLogin = (req, res) => {
    const baseUrl = "http://github.com/login/oauth/authorize";
    const config={
        client_id: process.env.GH_CLIENT,
        allow_signup:false,
        scope:"read:user user:email",
    };
    const params = new URLSearchParams(config).toString();
    const finalUrl = `${baseUrl}?${params}`;
    return res.redirect(finalUrl);
};


export const finishGithubLogin = async(req, res) => {
    const baseUrl = "https://github.com/login/oauth/access_token";
    const config ={
        client_id: process.env.GH_CLIENT,
        client_secret: process.env.GH_SECRET,
        code: req.query.code,
    };
    const params = new URLSearchParams(config).toString();
    const finalUrl = `${baseUrl}?${params}`;
    const tokenRequest = await (
        await fetch(finalUrl, {
            method:"POST",
            headers:{
                Accept: "application/json",
            },
        })
    ).json();
    if("access_token" in tokenRequest){
        const { access_token } = tokenRequest;
        const apiUrl = "https://api.github.com";
        const userData = await (
            await fetch(`${apiUrl}/user`, {
              headers: {
                Authorization: `token ${access_token}`,
              },
            })
          ).json();
        const emailData = await (
            await fetch(`${apiUrl}/user/emails`, {
              headers: {
                Authorization: `token ${access_token}`,
              },
            })
          ).json();
        const emailObj = emailData.find(
            (email) => email.primary === true && email.verified === true
        );
        if(!emailObj){
            return res.redirect("/login");
        }
        let user = await User.findOne({email : emailObj.email});
        if(!user){
            user = await User.create({
                username: userData.login,
                avatarUrl: userData.avatar_url,
                email: emailObj.email, 
                socialOnly: true,
                password:"",
                name: userData.name ? userData.name : "Unknown",
                location:userData.location,
            });
        }
        req.session.loggedIn = true;
        req.session.user = user;
        return res.redirect("/");
    } else{
        return res.redirent("/login");
    }
};

export const edit =(req, res) =>res.send("Edit User");



export const logout = (req, res) => {
    req.session.destroy();
    return res.redirect("/");
};

export const see = (req, res) => res.send("See User");

export const startKakaoLogin = (req, res) => {
    const REST_API_KEY = process.env.KA_KEY;
    const REDIRECT_URI = process.env.KA_REDIRECT;
    res.redirect(`https://kauth.kakao.com/oauth/authorize?client_id=${REST_API_KEY}&redirect_uri=${REDIRECT_URI}&response_type=code`);
};

export const finishKakaoLogin = async(req, res) => {
    const config= {
        client_id: process.env.KA_KEY,
        redirect_uri: process.env.KA_REDIRECT,
        client_secret: process.env.KA_SECRET,
        grant_type: "authorization_code",
        code: req.query.code,
    };
    const params = new URLSearchParams(config).toString();
    const baseUrl = "https://kauth.kakao.com/oauth/token";
    const finalUrl = `${baseUrl}?${params}`

    const tokenRequest = await(
        await fetch(finalUrl ,{
            method:"POST",
            headers:{
                Accept: "application/json",
            }
        })
    ).json();


    

    if("access_token" in tokenRequest){
        const { access_token } = tokenRequest;
        const apiUrl = "https://kapi.kakao.com/v1/user/access_token_info";
        const userData = await(
            await fetch(`${apiUrl}`,{
                headers:{
                    Authorization: `Bearer ${access_token}`, 
                },
            })
        ).json();


        const infoUrl = "https://kapi.kakao.com/v2/user/me";
        const userInfo = await(
            await fetch(`${infoUrl}`,{
                headers:{
                    Authorization: `Bearer ${access_token}`,
                },
                property_keys:["kakao_account.name"],
            })
        ).json();

        
        if(
            userInfo.kakao_account.is_email_valid === false||
            userInfo.kakao_account.is_email_verified === false
            ){
                return res.redirect("/login");
            }
        let user = await User.findOne({email: userInfo.kakao_account.email});
        if(!user){
            user = await User.create({
                email: userInfo.kakao_account.email,
                socialOnly: true,
                password: "",
                name: "kakao_unknown",
                avatarUrl: userInfo.properties.profile_image,
                username: userInfo.properties.nickname,
            });
        }

        req.session.loggedIn = true;
        req.session.user = user;
        return res.redirect("/");
    }
    
     
};
        