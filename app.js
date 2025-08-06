import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, limit, startAfter, serverTimestamp, doc, setDoc, getDoc, deleteDoc, updateDoc, where } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Global variables for Firebase instances
window.firebaseApp = null;
window.authInstance = null;
window.firestoreInstance = null;

// Firebase configuration (replace with your actual config if different)
const firebaseConfig = {
    apiKey: "AIzaSyAenBUkz8Ynac4jMttAxOhOGcGL6NiUZtQ",
    authDomain: "malik-sromik.firebaseapp.com",
    projectId: "malik-sromik",
    storageBucket: "malik-sromik.firebasestorage.app",
    messagingSenderId: "484276776897",
    appId: "1:484277776897:web:4e537355368a98b1124940",
    measurementId: "G-JY1Q35GER2"
};

// Canvas environment specific app ID for Firestore collection paths
const canvasAppId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
window.canvasAppId = canvasAppId; // Make it globally accessible

// Initialize Firebase
window.firebaseApp = initializeApp(firebaseConfig);
window.authInstance = getAuth(window.firebaseApp);
window.firestoreInstance = getFirestore(window.firebaseApp);

// Make Firebase functions globally accessible for the React code
window.getAuth = getAuth;
window.signInWithEmailAndPassword = signInWithEmailAndPassword;
window.createUserWithEmailAndPassword = createUserWithEmailAndPassword;
window.signOut = signOut;
window.onAuthStateChanged = onAuthStateChanged;
window.signInAnonymously = signInAnonymously;

window.getFirestore = getFirestore;
window.collection = collection;
window.addDoc = addDoc;
window.onSnapshot = onSnapshot;
window.query = query;
window.orderBy = orderBy;
window.limit = limit;
window.startAfter = startAfter;
window.serverTimestamp = serverTimestamp;
window.doc = doc;
window.setDoc = setDoc;
window.getDoc = getDoc;
window.deleteDoc = deleteDoc;
window.updateDoc = updateDoc;
window.where = where;

const { useState, useEffect } = React;
const ReactDOM = ReactDOM;

// Data for Divisions and Districts of Bangladesh
const DIVISIONS_DATA = {
    "ঢাকা": ["ঢাকা", "গাজীপুর", "ফরিদপুর", "গোপালগঞ্জ", "কিশোরগঞ্জ", "মাদারীপুর", "মানিকগঞ্জ", "মুন্সিগঞ্জ", "নারায়ণগঞ্জ", "নরসিংদী", "রাজবাড়ী", "শরীয়তপুর", "টাঙ্গাইল"],
    "চট্টগ্রাম": ["চট্টগ্রাম", "বান্দরবান", "ব্রাহ্মণবাড়িয়া", "চাঁদপুর", "কুমিল্লা", "কক্সবাজার", "ফেনী", "খাগড়াছড়ি", "লক্ষ্মীপুর", "নোয়াখালী", "রাঙ্গামাটি"],
    "রাজশাহী": ["রাজশাহী", "বগুড়া", "জয়পুরহাট", "নওগাঁ", "নাটোর", "চাঁপাইনবাবগঞ্জ", "পাবনা", "সিরাজগঞ্জ"],
    "খুলনা": ["খুলনা", "বাগেরহাট", "চুয়াডাঙ্গা", "যশোর", "ঝিনাইদহ", "কুষ্টিয়া", "মাগুরা", "মেহেরপুর", "নড়াইল", "সাতক্ষীরা"],
    "বরিশাল": ["বরিশাল", "ভোলা", "ঝালকাঠি", "বরগুনা", "পটুয়াখালী", "পিরোজপুর"],
    "সিলেট": ["সিলেট", "হবিগঞ্জ", "মৌলভীবাজার", "সুনামগঞ্জ"],
    "রংপুর": ["রংপুর", "দিনাজপুর", "গাইবান্ধা", "কুড়িগ্রাম", "লালমনিরহাট", "নীলফামারী", "পঞ্চগড়", "ঠাকুরগাঁও"],
    "ময়মনসিংহ": ["ময়মনসিংহ", "জামালপুর", "নেত্রকোণা", "শেরপুর"]
};

/**
 * Helper function to format time elapsed since a given timestamp.
 * @param {Object} timestamp - Firestore Timestamp object.
 * @returns {string} - Formatted string like "5 মিনিট আগে", "2 ঘণ্টা আগে", "3 দিন আগে".
 */
const formatTimeAgo = (timestamp) => {
    if (!timestamp || !timestamp.toDate) return '';
    const now = new Date();
    const postDate = timestamp.toDate();
    const diffMs = now.getTime() - postDate.getTime(); // Difference in milliseconds

    const diffMinutes = Math.round(diffMs / (1000 * 60));
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
        return "এইমাত্র";
    } else if (diffMinutes < 60) {
        return `${diffMinutes} মিনিট আগে`;
    } else if (diffHours < 24) {
        const remainingMinutes = diffMinutes % 60;
        if (remainingMinutes > 0) {
            return `${diffHours} ঘণ্টা ${remainingMinutes} মিনিট আগে`;
        }
        return `${diffHours} ঘণ্টা আগে`;
    } else {
        return `${diffDays} দিন আগে`;
    }
};

/**
 * AuthForm component for handling user login and signup.
 * It's a modal form that toggles between login and signup modes.
 */
function AuthForm({ mode, onClose, onToggleMode, authInstance, onAuthSuccess }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState(''); // New state for full name
    const [authError, setAuthError] = useState(null);
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    // Handles either login or signup based on the current mode
    const handleAuth = async (e) => {
        e.preventDefault();
        setAuthError(null); // Clear previous errors
        setIsAuthenticating(true); // Set authenticating state

        try {
            if (mode === 'login') {
                // Sign in existing user
                const userCredential = await window.signInWithEmailAndPassword(authInstance, email, password);
                onAuthSuccess(userCredential.user, null); // No full name for login
            } else { // signup
                // Validate full name for signup
                if (!fullName.trim()) {
                    setAuthError("অনুগ্রহ করে আপনার সম্পূর্ণ নাম লিখুন।");
                    return;
                }
                // Create new user
                const userCredential = await window.createUserWithEmailAndPassword(authInstance, email, password);
                onAuthSuccess(userCredential.user, fullName.trim()); // Pass full name for signup
            }
        } catch (error) {
            console.error("Authentication error:", error);
            let errorMessage = "প্রমাণীকরণে সমস্যা হয়েছে।"; // Default error message

            // Provide more specific error messages based on Firebase error codes
            if (error.code === 'auth/invalid-email') {
                errorMessage = "অকার্যকর ইমেল ঠিকানা।";
            } else if (error.code === 'auth/user-disabled') {
                errorMessage = "এই ব্যবহারকারী নিষ্ক্রিয় করা হয়েছে।";
            } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                errorMessage = "ভুল ইমেল বা পাসওয়ার্ড।";
            } else if (error.code === 'auth/email-already-in-use') {
                errorMessage = "এই ইমেল ঠিকানাটি ইতিমধ্যেই ব্যবহৃত হচ্ছে।";
            } else if (error.code === 'auth/weak-password') {
                errorMessage = "পাসওয়ার্ডটি খুব দুর্বল। কমপক্ষে 6 অক্ষর ব্যবহার করুন।";
            } else if (error.code === 'auth/operation-not-allowed') {
                errorMessage = "ইমেল/পাসওয়ার্ড লগইন সক্ষম করা হয়নি।";
            }
            setAuthError(errorMessage); // Display the error message to the user
        } finally {
            setIsAuthenticating(false); // Reset authenticating state
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50 modal-scroll-y">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm transform transition-all duration-300 scale-100 opacity-100 my-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">{mode === 'login' ? 'লগইন করুন' : 'সাইনআপ করুন'}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-full p-1 transition duration-150 ease-in-out"
                        aria-label="ফর্ম বন্ধ করুন"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                {/* Display authentication error messages */}
                {authError && (
                    <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">
                        {authError}
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-4">
                    {mode === 'signup' && (
                        <div>
                            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">সম্পূর্ণ নাম <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                id="fullName"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                required={mode === 'signup'}
                            />
                        </div>
                    )}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">ইমেল</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">পাসওয়ার্ড</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            required
                        />
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                        <button
                            type="submit"
                            className="inline-flex justify-center py-2 px-5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                            disabled={isAuthenticating} // Disable button during authentication
                        >
                            {isAuthenticating ? 'প্রমাণীকরণ হচ্ছে...' : (mode === 'login' ? 'লগইন করুন' : 'সাইনআপ করুন')}
                        </button>
                    </div>
                </form>

                <p className="mt-4 text-center text-sm text-gray-600">
                    {mode === 'login' ? "আপনার কি অ্যাকাউন্ট নেই?" : "আপনার কি ইতিমধ্যেই একটি অ্যাকাউন্ট আছে?"}{' '}
                    <button
                        onClick={onToggleMode} // Toggle between login and signup modes
                        className="font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:underline"
                    >
                        {mode === 'login' ? 'সাইনআপ করুন' : 'লগইন করুন'}
                    </button>
                </p>
            </div>
        </div>
    );
}

    /**
     * PostJobForm component for creating a new job post.
     * It's a modal form that allows users to fill out job details and submit.
     */
    function PostJobForm({ onClose, firestoreInstance, user }) {
        const [jobTitle, setJobTitle] = useState('');
        const [jobDescription, setJobDescription] = useState('');
        const [requiredSkills, setRequiredSkills] = useState('');
        const [wage, setWage] = useState('');
        const [isPosting, setIsPosting] = useState(false);
        const [postError, setPostError] = useState(null);
        const [selectedDivision, setSelectedDivision] = useState('');
        const [selectedDistrict, setSelectedDistrict] = useState('');

        const handleSubmit = async (e) => {
            e.preventDefault();
            setIsPosting(true);
            setPostError(null);

            if (!user) {
                setPostError('পোস্ট করার জন্য আপনাকে অবশ্যই লগইন করতে হবে।');
                setIsPosting(false);
                return;
            }

            try {
                const docRef = await window.addDoc(window.collection(firestoreInstance, `canvas-${window.canvasAppId}-job-posts`), {
                    authorId: user.uid,
                    authorEmail: user.email,
                    jobTitle,
                    jobDescription,
                    requiredSkills: requiredSkills.split(',').map(skill => skill.trim()),
                    wage: parseFloat(wage),
                    division: selectedDivision,
                    district: selectedDistrict,
                    createdAt: window.serverTimestamp(),
                });
                console.log("Document written with ID: ", docRef.id);
                onClose(); // Close the modal on success
            } catch (error) {
                console.error("Error adding document: ", error);
                setPostError("পোস্ট করতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
            } finally {
                setIsPosting(false);
            }
        };

        const districts = selectedDivision ? DIVISIONS_DATA[selectedDivision] : [];

        return (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50 modal-scroll-y">
                <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg transform transition-all duration-300 scale-100 opacity-100 my-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">নতুন কাজের পোস্ট</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-full p-1 transition duration-150 ease-in-out"
                            aria-label="ফর্ম বন্ধ করুন"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>

                    {postError && (
                        <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">
                            {postError}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 mb-1">কাজের শিরোনাম <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                id="jobTitle"
                                value={jobTitle}
                                onChange={(e) => setJobTitle(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="jobDescription" className="block text-sm font-medium text-gray-700 mb-1">কাজের বর্ণনা <span className="text-red-500">*</span></label>
                            <textarea
                                id="jobDescription"
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                                rows="4"
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                required
                            ></textarea>
                        </div>
                        
                        <div>
                            <label htmlFor="requiredSkills" className="block text-sm font-medium text-gray-700 mb-1">প্রয়োজনীয় দক্ষতা (কমা দ্বারা আলাদা করুন)</label>
                            <input
                                type="text"
                                id="requiredSkills"
                                value={requiredSkills}
                                onChange={(e) => setRequiredSkills(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>

                        <div>
                            <label htmlFor="wage" className="block text-sm font-medium text-gray-700 mb-1">মজুরি (ঘণ্টায়/প্রতিদিন/এককালীন)</label>
                            <input
                                type="text"
                                id="wage"
                                value={wage}
                                onChange={(e) => setWage(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="division" className="block text-sm font-medium text-gray-700 mb-1">বিভাগ <span className="text-red-500">*</span></label>
                                <select
                                    id="division"
                                    value={selectedDivision}
                                    onChange={(e) => {
                                        setSelectedDivision(e.target.value);
                                        setSelectedDistrict(''); // Reset district when division changes
                                    }}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    required
                                >
                                    <option value="" disabled>একটি বিভাগ নির্বাচন করুন</option>
                                    {Object.keys(DIVISIONS_DATA).map(division => (
                                        <option key={division} value={division}>{division}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1">জেলা <span className="text-red-500">*</span></label>
                                <select
                                    id="district"
                                    value={selectedDistrict}
                                    onChange={(e) => setSelectedDistrict(e.target.value)}
                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    required
                                    disabled={!selectedDivision}
                                >
                                    <option value="" disabled>একটি জেলা নির্বাচন করুন</option>
                                    {districts.map(district => (
                                        <option key={district} value={district}>{district}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                type="submit"
                                className="inline-flex justify-center py-2 px-5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out"
                                disabled={isPosting}
                            >
                                {isPosting ? 'পোস্ট করা হচ্ছে...' : 'পোস্ট করুন'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

// (The remaining components and main App logic would follow here)
