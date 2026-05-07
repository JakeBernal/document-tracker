import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/navbar";
import "../css/profile.css";

const API_BASE_URL = "http://localhost:5001";

const emptyProfile = {
  date_of_birth: "",
  gender: "",
  civil_status: "",
  mobile_number: "",
  province: "",
  city_municipality: "",
  barangay: "",
  street_purok_sitio: "",
  house_number: "",
  complete_address: "",
  occupation_type: "",
  school_company_name: "",
  valid_id_type: "",
  valid_id_number: "",
  valid_id_path: "",
  valid_id_file_name: "",
  emergency_contact_name: "",
  emergency_contact_number: "",
  verification_status: "Not Verified",
};

export default function Profile() {
  const navigate = useNavigate();

  const requiredFields = [
    "date_of_birth",
    "gender",
    "mobile_number",
    "province",
    "city_municipality",
    "barangay",
    "street_purok_sitio",
    "occupation_type",
  ];

  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");
  const [validIdFile, setValidIdFile] = useState(null);
  const [validIdFileName, setValidIdFileName] = useState("");
  const [profile, setProfile] = useState(emptyProfile);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getLatestAllowedBirthDate = () => {
    const today = new Date();
    const date = new Date(
      today.getFullYear() - 18,
      today.getMonth(),
      today.getDate()
    );
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const getAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;

    const [year, month, day] = dateOfBirth.split("-").map(Number);

    if (!year || !month || !day) return null;

    const today = new Date();
    let age = today.getFullYear() - year;

    const birthdayAlreadyPassed =
      today.getMonth() + 1 > month ||
      (today.getMonth() + 1 === month && today.getDate() >= day);

    if (!birthdayAlreadyPassed) {
      age -= 1;
    }

    return age;
  };

  const isAtLeast18 = (dateOfBirth) => {
    const age = getAge(dateOfBirth);
    return age !== null && age >= 18;
  };

  const showMessage = (text, type = "info") => {
    setMessage(text);
    setMessageType(type);
  };

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const userRaw = localStorage.getItem("user");

    if (!storedToken || !userRaw) {
      navigate("/signin");
      return;
    }

    try {
      const storedUser = JSON.parse(userRaw);
      setUser(storedUser);
      setToken(storedToken);
    } catch (error) {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      navigate("/signin");
    }
  }, [navigate]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!token) return;

      try {
        setIsLoading(true);

        const res = await fetch(`${API_BASE_URL}/api/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          showMessage(data.message || "Unable to load profile.", "error");
          return;
        }

        const loadedProfile = {
          ...emptyProfile,
          ...(data.profile || {}),
        };

        setProfile(loadedProfile);
        setValidIdFileName(loadedProfile.valid_id_file_name || "");
      } catch (error) {
        console.error("LOAD PROFILE ERROR:", error);
        showMessage("Cannot connect to server while loading profile.", "error");
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [token]);

  const getCompletion = () => {
    const completedFields = requiredFields.filter((field) => {
      if (field === "date_of_birth") {
        return profile.date_of_birth && isAtLeast18(profile.date_of_birth);
      }

      return profile[field] && String(profile[field]).trim() !== "";
    });

    return Math.round((completedFields.length / requiredFields.length) * 100);
  };

  const isFullyVerified = () => {
    const hasAllRequiredFields = requiredFields.every((field) => {
      return profile[field] && String(profile[field]).trim() !== "";
    });

    return hasAllRequiredFields && isAtLeast18(profile.date_of_birth);
  };

  const buildCompleteAddress = (updatedProfile) => {
    const parts = [
      updatedProfile.house_number,
      updatedProfile.street_purok_sitio,
      updatedProfile.barangay,
      updatedProfile.city_municipality,
      updatedProfile.province,
    ].filter((item) => item && String(item).trim() !== "");

    return parts.join(", ");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setProfile((prev) => {
      const updatedProfile = {
        ...prev,
        [name]: value,
      };

      const addressFields = [
        "house_number",
        "street_purok_sitio",
        "barangay",
        "city_municipality",
        "province",
      ];

      if (addressFields.includes(name)) {
        updatedProfile.complete_address = buildCompleteAddress(updatedProfile);
      }

      return updatedProfile;
    });

    setMessage("");
  };

  const handleValidIdChange = (e) => {
    const file = e.target.files[0];

    if (!file) {
      setValidIdFile(null);
      setValidIdFileName(profile.valid_id_file_name || "");
      return;
    }

    setValidIdFile(file);
    setValidIdFileName(file.name);
    setMessage("");
  };

  const validateProfile = () => {
    if (profile.date_of_birth && !isAtLeast18(profile.date_of_birth)) {
      return "Minimum age requirement is 18 years old. The account cannot be Fully Verified.";
    }

    if (
      profile.mobile_number &&
      !/^09\d{9}$/.test(String(profile.mobile_number).trim())
    ) {
      return "Please enter a valid Philippine mobile number. Example: 09123456789.";
    }

    return "";
  };

  const appendFormValue = (formData, key, value) => {
    formData.append(key, value || "");
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    if (!user || !token) {
      navigate("/signin");
      return;
    }

    const validationError = validateProfile();

    if (validationError) {
      showMessage(validationError, "error");
      return;
    }

    try {
      setIsSubmitting(true);
      showMessage("", "");

      const finalProfile = {
        ...profile,
        complete_address: buildCompleteAddress(profile),
      };

      const formData = new FormData();

      Object.entries(finalProfile).forEach(([key, value]) => {
        if (
          key === "id" ||
          key === "user_id" ||
          key === "valid_id_path" ||
          key === "valid_id_file_name" ||
          key === "verification_status" ||
          key === "age" ||
          key === "age_eligible" ||
          key === "minimum_age" ||
          key === "latest_allowed_birth_date" ||
          key === "missing_fields"
        ) {
          return;
        }

        appendFormValue(formData, key, value);
      });

      if (validIdFile) {
        formData.append("valid_id", validIdFile);
      }

      const res = await fetch(`${API_BASE_URL}/api/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        showMessage(data.message || "Unable to save profile.", "error");
        return;
      }

      const savedProfile = {
        ...emptyProfile,
        ...(data.profile || {}),
      };

      setProfile(savedProfile);
      setValidIdFile(null);
      setValidIdFileName(savedProfile.valid_id_file_name || "");
      showMessage(data.message || "Profile saved successfully.", "success");
    } catch (error) {
      console.error("SAVE PROFILE ERROR:", error);
      showMessage("Cannot connect to server while saving profile.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const completion = getCompletion();
  const status = isFullyVerified() ? "Fully Verified" : "Not Verified";
  const age = getAge(profile.date_of_birth);
  const ageHint = profile.date_of_birth
    ? isAtLeast18(profile.date_of_birth)
      ? `Age requirement passed. Current age: ${age}.`
      : `Age requirement not met. Current age: ${age}. Minimum age is 18.`
    : "Select date of birth. Minimum age is 18 years old.";

  return (
    <>
      <Navbar />

      <section className="profile-page">
        <div className="profile-header">
          <div>
            <h1>Citizen Profile Verification</h1>
            <p>
              Complete your profile information before requesting official
              documents.
            </p>
          </div>

          <div
            className={
              status === "Fully Verified"
                ? "profile-status verified"
                : "profile-status not-verified"
            }
          >
            {status}
          </div>
        </div>

        <div className="profile-layout">
          <aside className="profile-summary-card">
            <div className="profile-avatar">
              {user?.full_name?.charAt(0).toUpperCase() || "U"}
            </div>

            <h2>{user?.full_name || "Citizen"}</h2>
            <p>{user?.email || "No email"}</p>

            <div className="profile-progress">
              <div className="profile-progress-top">
                <span>Profile Completion</span>
                <strong>{completion}%</strong>
              </div>

              <div className="profile-progress-bar">
                <div
                  className="profile-progress-fill"
                  style={{ width: `${completion}%` }}
                ></div>
              </div>
            </div>

            <div className="profile-note">
              <strong>Verification Rule</strong>
              <p>
                Required fields must be completed and the citizen must be at
                least 18 years old before the account becomes Fully Verified.
              </p>
            </div>

            <button
              type="button"
              className="profile-secondary-btn"
              onClick={() => navigate("/citizen")}
            >
              Back to Dashboard
            </button>
          </aside>

          <form className="profile-form-card" onSubmit={handleSaveProfile}>
            {isLoading && <p className="profile-message">Loading profile...</p>}

            {message && (
              <p className={`profile-message ${messageType}`}>{message}</p>
            )}

            <div className="profile-section-title">
              <h2>Account Information</h2>
              <p>Basic account details from registration.</p>
            </div>

            <div className="profile-grid">
              <div className="profile-field">
                <label>Full Name</label>
                <input value={user?.full_name || ""} disabled />
              </div>

              <div className="profile-field">
                <label>Email Address</label>
                <input value={user?.email || ""} disabled />
              </div>
            </div>

            <div className="profile-section-title">
              <h2>Personal Information</h2>
              <p>Required details for identity verification.</p>
            </div>

            <div className="profile-grid">
              <div className="profile-field">
                <label>
                  Date of Birth <span>*</span>
                </label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={profile.date_of_birth}
                  onChange={handleChange}
                  max={getLatestAllowedBirthDate()}
                />
                <p
                  className={
                    profile.date_of_birth && !isAtLeast18(profile.date_of_birth)
                      ? "profile-age-hint error"
                      : "profile-age-hint"
                  }
                >
                  {ageHint}
                </p>
              </div>

              <div className="profile-field">
                <label>
                  Gender <span>*</span>
                </label>
                <select
                  name="gender"
                  value={profile.gender}
                  onChange={handleChange}
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div className="profile-field">
                <label>Civil Status</label>
                <select
                  name="civil_status"
                  value={profile.civil_status}
                  onChange={handleChange}
                >
                  <option value="">Select civil status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Separated">Separated</option>
                </select>
              </div>

              <div className="profile-field">
                <label>
                  Mobile Number <span>*</span>
                </label>
                <input
                  type="text"
                  name="mobile_number"
                  value={profile.mobile_number}
                  onChange={handleChange}
                  placeholder="Example: 09123456789"
                />
              </div>
            </div>

            <div className="profile-section-title">
              <h2>Address Information</h2>
              <p>Provide complete barangay and residence information.</p>
            </div>

            <div className="profile-grid">
              <div className="profile-field">
                <label>
                  Province <span>*</span>
                </label>
                <input
                  type="text"
                  name="province"
                  value={profile.province}
                  onChange={handleChange}
                  placeholder="Example: Zamboanga del Norte"
                />
              </div>

              <div className="profile-field">
                <label>
                  City / Municipality <span>*</span>
                </label>
                <input
                  type="text"
                  name="city_municipality"
                  value={profile.city_municipality}
                  onChange={handleChange}
                  placeholder="Example: Dipolog City"
                />
              </div>

              <div className="profile-field">
                <label>
                  Barangay <span>*</span>
                </label>
                <input
                  type="text"
                  name="barangay"
                  value={profile.barangay}
                  onChange={handleChange}
                  placeholder="Example: Central"
                />
              </div>

              <div className="profile-field">
                <label>
                  Street / Purok / Sitio <span>*</span>
                </label>
                <input
                  type="text"
                  name="street_purok_sitio"
                  value={profile.street_purok_sitio}
                  onChange={handleChange}
                  placeholder="Example: Purok 3"
                />
              </div>

              <div className="profile-field">
                <label>House No. / Block / Lot</label>
                <input
                  type="text"
                  name="house_number"
                  value={profile.house_number}
                  onChange={handleChange}
                  placeholder="Example: House No. 214"
                />
              </div>

              <div className="profile-field full">
                <label>Complete Address</label>
                <textarea
                  name="complete_address"
                  value={profile.complete_address}
                  onChange={handleChange}
                  placeholder="Complete address will appear here"
                  rows="3"
                ></textarea>
              </div>
            </div>

            <div className="profile-section-title">
              <h2>Citizen Classification</h2>
              <p>Used for records, reports, and future discount validation.</p>
            </div>

            <div className="profile-grid">
              <div className="profile-field">
                <label>
                  Occupation Type <span>*</span>
                </label>
                <select
                  name="occupation_type"
                  value={profile.occupation_type}
                  onChange={handleChange}
                >
                  <option value="">Select occupation type</option>
                  <option value="Student">Student</option>
                  <option value="Employed">Employed</option>
                  <option value="Self-employed">Self-employed</option>
                  <option value="Unemployed">Unemployed</option>
                  <option value="Senior Citizen">Senior Citizen</option>
                  <option value="PWD">PWD</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="profile-field">
                <label>School / Company Name</label>
                <input
                  type="text"
                  name="school_company_name"
                  value={profile.school_company_name}
                  onChange={handleChange}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="profile-section-title">
              <h2>Verification Document</h2>
              <p>Upload a valid ID for stronger profile verification.</p>
            </div>

            <div className="profile-grid">
              <div className="profile-field">
                <label>Valid ID Type</label>
                <select
                  name="valid_id_type"
                  value={profile.valid_id_type}
                  onChange={handleChange}
                >
                  <option value="">Select ID type</option>
                  <option value="School ID">School ID</option>
                  <option value="National ID">National ID</option>
                  <option value="Driver License">Driver License</option>
                  <option value="Passport">Passport</option>
                  <option value="Voter ID">Voter ID</option>
                  <option value="Barangay ID">Barangay ID</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="profile-field">
                <label>Valid ID Number</label>
                <input
                  type="text"
                  name="valid_id_number"
                  value={profile.valid_id_number}
                  onChange={handleChange}
                  placeholder="Optional"
                />
              </div>

              <div className="profile-field full">
                <label>Upload Valid ID</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleValidIdChange}
                />

                {validIdFileName && (
                  <p className="profile-file-name">
                    Selected file: {validIdFileName}
                  </p>
                )}
              </div>
            </div>

            <div className="profile-section-title">
              <h2>Emergency Contact</h2>
              <p>Optional contact person for record purposes.</p>
            </div>

            <div className="profile-grid">
              <div className="profile-field">
                <label>Emergency Contact Name</label>
                <input
                  type="text"
                  name="emergency_contact_name"
                  value={profile.emergency_contact_name}
                  onChange={handleChange}
                  placeholder="Optional"
                />
              </div>

              <div className="profile-field">
                <label>Emergency Contact Number</label>
                <input
                  type="text"
                  name="emergency_contact_number"
                  value={profile.emergency_contact_number}
                  onChange={handleChange}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="profile-actions">
              <button
                type="button"
                className="profile-cancel-btn"
                onClick={() => navigate("/citizen")}
                disabled={isSubmitting}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="profile-save-btn"
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting ? "Saving Profile..." : "Save Profile Verification"}
              </button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
