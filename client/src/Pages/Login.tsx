import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../Styles/Login.style.css';
import GoogleButton from 'react-google-button';
import { auth } from '../services/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { postUser, user, getUser } from '../services/server-client';

type LoginProps = {
  setUserId: React.Dispatch<React.SetStateAction<string>>;
  setUserMail: React.Dispatch<React.SetStateAction<string>>;
  setUserName: React.Dispatch<React.SetStateAction<string>>;
  userId: string;
  userMail: string;
  userName: string;
};

const Login: React.FC<LoginProps> = ({
  setUserId,
  setUserMail,
  setUserName,
  userName,
  userMail,
  userId,
}) => {
  const navigate = useNavigate();

  const onSubmitHandler = (event: React.FormEvent) => {
    event.preventDefault();
    const target = event.target as typeof event.target & {
      userId: { value: string };
    };
    const userId: string = target.userId.value;

    if (userId) {
      setUserId(userId);
    }

    navigate(`/${userId}/template`);
  };

  const checkExistingUser = async (id: string, name: string, mail: string) => {
    if (id && name && mail !== null) {
      const result = await getUser(id);
      if (result) {
        return true;
      } else {
        return false;
      }
    }
  };

  const signInWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then((result) => {
        const googleUserId = result.user.uid;
        const googleUserName = result.user.displayName;
        const googleUserMail = result.user.email;
        let newUser = {
          userId: '',
          name: '',
          email: '',
        };
        if (googleUserId && googleUserName && googleUserMail) {
          setUserId(googleUserId);
          setUserName(googleUserName);
          setUserMail(googleUserMail);
          newUser.userId = googleUserId;
          newUser.name = googleUserName;
          newUser.email = googleUserMail;

          checkExistingUser(googleUserId, googleUserName, googleUserMail);

          postUser(newUser);
        }
        navigate(`/${googleUserId}/template`);
        console.log(result);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  return (
    <div>
      <div id='bday'>Bday.</div>
      <div className='form-container'>
        <form className='login-form' onSubmit={onSubmitHandler}>
          <label>User Id</label>
          <input type='text' name='userId' placeholder='user Id' />
          <label>Password</label>
          <input type='text' name='password' placeholder='password' />
          <button type='submit'>Login</button>
        </form>
        <GoogleButton className='googleBtn' onClick={signInWithGoogle} />
      </div>
    </div>
  );
};
export default Login;
