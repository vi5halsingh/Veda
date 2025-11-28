import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import api from "../config/Api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export default function Signup(props) {
  const navigate = useNavigate();
  const [data, setData] = useState({
    email: "",
    fullname: {
      firstname: "",
      lastname: "",
    },
    password: "",
  });
  const handleSubmit = async (e) => {
    e.preventDefault();
    // console.log(data);
    try {
      const response = await api.post("/auth/register", data);
      if (response.status === 200) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
        localStorage.setItem("lastLoginTime", new Date().getTime().toString());
        
        toast.success("Registered successfully !", {
          position: "bottom-right",
          autoClose: 2000,
          hideProgressBar: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "dark",
          closeOnClick: true,
        });
        
        navigate("/");
        return;
      }
    } catch (error) {
      if (error.status === 409) {
        toast.error("Already have an account ! try another mail", {
          position: "bottom-right",
          autoClose: 2000,
          hideProgressBar: false,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
          closeOnClick: true,
        });
      }else{
          toast.error("Something went wrong", {
        position: "bottom-right",
        autoClose: 2000,
        hideProgressBar: false,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
        closeOnClick: true,
      });
      }
    
    }
  };
  const handleSetType = (e) => {
    e.preventDefault();
    props.setType((p) => "login");
  };

  return (
    <div className="flex w-full md:w-1/2 items-center justify-center p-8 bg-[#0a0a0a]">
      <div className="max-w-md w-full bg-[#1a1a1a] rounded-2xl p-8 border border-[#404040] shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        <h1 className="text-3xl font-bold text-[#f3f4f6] mb-6">Sign up</h1>
        <form className="space-y-5" onSubmit={handleSubmit}>
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-[#d1d5db]">
              First name
            </label>
            <input
              type="text"
              placeholder="Enter your first name"
              className="mt-1 w-full px-4 py-2 border border-[#404040] rounded-lg focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] focus:outline-none bg-[#0f0f0f] text-[#f3f4f6] placeholder:text-[#6b7280] transition-all"
              value={data.fullname?.firstname}
              onChange={(e) =>
                setData({
                  ...data,
                  fullname: { ...data.fullname, firstname: e.target.value },
                })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#d1d5db]">
              Last name
            </label>
            <input
              type="text"
              placeholder="Enter your last name"
              className="mt-1 w-full px-4 py-2 border border-[#404040] rounded-lg focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] focus:outline-none bg-[#0f0f0f] text-[#f3f4f6] placeholder:text-[#6b7280] transition-all"
              value={data.fullname.lastname}
              onChange={(e) =>
                setData({
                  ...data,
                  fullname: {
                    ...data.fullname,
                    lastname: e.target.value,
                  },
                })
              }
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-[#d1d5db]">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              className="mt-1 w-full px-4 py-2 border border-[#404040] rounded-lg focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] focus:outline-none bg-[#0f0f0f] text-[#f3f4f6] placeholder:text-[#6b7280] transition-all"
              name="email"
              value={data?.email}
              onChange={(e) => {
                setData({ ...data, email: e.target.value });
              }}
            />
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-[#d1d5db]">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              className="mt-1 w-full px-4 py-2 border border-[#404040] rounded-lg focus:ring-2 focus:ring-[#3b82f6] focus:border-[#3b82f6] focus:outline-none bg-[#0f0f0f] text-[#f3f4f6] placeholder:text-[#6b7280] transition-all"
              name="password"
              value={data?.password}
              onChange={(e) => {
                setData({ ...data, password: e.target.value });
              }}
            />
          </div>

          {/* Sign Up Button */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-[#3b82f6] to-[#6366f1] text-white py-2 rounded-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-[0_4px_20px_rgba(59,130,246,0.3)] hover:shadow-[0_6px_30px_rgba(59,130,246,0.5)]"
          >
            Create account
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-6">
          <hr className="flex-1 border-[#404040]" />
          <span className="px-3 text-[#6b7280] text-sm">or</span>
          <hr className="flex-1 border-[#404040]" />
        </div>

        {/* Social Buttons */}
        <div className="space-y-3">
          <button className="w-full border border-[#404040] py-2 rounded-lg flex items-center justify-center hover:bg-[#252525] transition-all text-[#f3f4f6]">
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-5 h-5 mr-2"
            />
            Sign up with Google
          </button>

          <button className="w-full border border-[#404040] py-2 rounded-lg flex items-center justify-center hover:bg-[#252525] transition-all text-[#f3f4f6]">
            <img
              src="https://www.svgrepo.com/show/512317/github-142.svg"
              alt="GitHub"
              className="w-5 h-5 mr-2"
            />
            Sign up with GitHub
          </button>
        </div>

        {/* Already have account */}
        <p className="mt-6 text-center text-[#9ca3af] text-sm">
          Already have an account?{" "}
          <NavLink
            className="text-[#3b82f6] font-medium hover:text-[#6366f1] hover:underline transition-colors"
            onClick={handleSetType}
          >
            Log in
          </NavLink>
        </p>
      </div>
    </div>
  );
}
