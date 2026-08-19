import { text } from "@fortawesome/fontawesome-svg-core";
import { Link } from "react-router-dom";

const styles = {
    boxWidth            : "xl:max-w-[1350px] w-full",
    boxWidthEx          : "xl:max-w-[1550px] w-full",
    heading2            : "font-poppins font-semibold xs:text-[48px] text-[40px] text-white xs:leading-[76.8px] leading-[66.8px] w-full",
    paragraph           : "font-poppins font-normal text-dimWhite text-[18px] leading-[30.8px]",

    flexCenter          : "flex justify-center items-center",
    flexStart           : "flex justify-center items-start",
    flexLeft            : "flex  items-start",

    paddingX            : "sm:px-16 px-6",
    paddingY            : "sm:py-16 py-6",
    padding             : "sm:px-16 px-6 sm:py-12 py-4",

    marginX             : "sm:mx-16 mx-6",
    marginY             : "sm:my-16 my-6",
    marginX2            : "sm:mx-16"
};

export const main = {
    font                : "font-poppins",
    font_secondary      : "font-roboto",
    container           : "container mx-auto",
    background          : "bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50"
}

export const dark = {
    body                : "bg-[#1C1C1C]",
    color               : "text-white",
    background          : "bg-[#0e0e0e]",
    semibackground      : "bg-[#1C1C1C]",
    focusbackground     : "bg-[#2B2B2B]",
    thirdbackground     : "bg-[#1A1A1A]",
    border              : "border-[#0e0e0e]",
    row                 : "bg-[#0e0e0e] hover:bg-[#1A1A1A] transition-all",
    semiborder          : "border-[#1C1C1C]",
    heading             : "text-white",
    text                : "text-gray-400",
    secondarytext       : "text-blue-400",
    link                : "cursor-pointer hover:text-blue-400 transition-all",
    active_link         : "cursor-pointer text-blue-400 transition-all",
    icon                : "text-white hover:text-blue-600 transition-all",
    button              : "bg-white hover:bg-blue-600 border border-white hover:border-blue-600 text-[#0e0e0e] hover:text-white font-medium py-1.5 px-4 transition-colors duration-300 ease-in-out",
    button_transparent  : "text-white hover:text-blue-400 font-medium hover:underline transition-all",
    button_secondary    : "bg-blue-600 hover:bg-blue-700 transition-all",
    button_third        : "bg-[#1C1C1C] hover:bg-blue-600 border border-[#1C1C1C] hover:border-blue-600 text-white hover:text-white py-1.5 px-4 transition-colors duration-300 ease-in-out",
    list_button         : "bg-[#0e0e0e] hover:bg-blue-600 text-white",
    active_list_button  : "bg-blue-600 text-white transition-all",
    paginate_btn        : "p-2 px-3.5 hover:bg-blue-600 bg-[#0e0e0e] hover:text-white rounded-md transition-all disabled:cursor-not-allowed cursor-pointers",
    input               : "bg-[#1C1C1C] border border-solid border-[#2B2B2B] text-gray-300 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 focus:bg-[#2B2B2B] transition-all duration-200 outline-none rounded-lg shadow-sm",
    input_icon          : "text-gray-300",
    view_button         : "text-green-600 hover:text-green-700 transition-all",
    edit_button         : "text-yellow-400 hover:text-yellow-500 transition-all",
    delete_button       : "text-red-600 hover:text-red-700 transition-all",
}

export const light = {
    body                : "bg-gradient-to-br from-blue-50 via-sky-50 to-cyan-50",
    color               : "text-slate-800",
    background          : "bg-gradient-to-br from-blue-50 to-sky-100",
    semibackground      : "bg-white/80 backdrop-blur-sm",
    focusbackground     : "bg-blue-100/50",
    thirdbackground     : "bg-sky-50/60",
    border              : "border-blue-200/60",
    row                 : "bg-white/40 hover:bg-blue-100/50 backdrop-blur-sm transition-all duration-200 rounded-lg",
    semiborder          : "border-blue-300/40",
    heading             : "text-blue-700 font-semibold",
    text                : "text-slate-700",
    secondarytext       : "font-medium text-blue-600",
    link                : "cursor-pointer hover:text-blue-600 transition-all duration-200 font-medium",
    active_link         : "cursor-pointer text-blue-600 font-semibold transition-all",
    icon                : "text-blue-600 hover:text-blue-700 transition-all duration-200",
    button              : "bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 border border-blue-400/30 text-white font-medium py-1.5 px-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 ease-in-out",
    button_transparent  : "text-blue-600 hover:text-blue-700 font-medium hover:underline transition-all duration-200",
    button_secondary    : "bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white font-medium py-1.5 px-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300",
    list_button         : "bg-white/60 hover:bg-gradient-to-r hover:from-blue-500 hover:to-sky-500 hover:text-white text-blue-700 rounded-lg transition-all duration-200 backdrop-blur-sm",
    active_list_button  : "bg-gradient-to-r from-blue-500 to-sky-500 text-white rounded-lg shadow-sm transition-all",
    paginate_btn        : "p-2 px-3.5 rounded-lg hover:bg-gradient-to-r hover:from-blue-500 hover:to-sky-500 hover:text-white disabled:cursor-not-allowed cursor-pointer bg-white/60 border border-blue-200/60 text-blue-700 leading-tight transition-all duration-200 outline-none backdrop-blur-sm shadow-sm hover:shadow-md",
    input               : "bg-white/80 border border-blue-200/60 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400 focus:bg-white transition-all duration-200 outline-none rounded-lg backdrop-blur-sm shadow-sm",
    input_icon          : "text-blue-600",
    view_button         : "text-emerald-600 hover:text-emerald-700 transition-all duration-200 font-medium",
    edit_button         : "text-amber-600 hover:text-amber-700 transition-all duration-200 font-medium",
    delete_button       : "text-rose-600 hover:text-rose-700 transition-all duration-200 font-medium",
}

export const layout = {
    section             : `flex md:flex-row flex-col ${styles.paddingY}`,
    sectionReverse      : `flex md:flex-row flex-col-reverse ${styles.paddingY}`,

    sectionImgReverse   : `flex-1 flex ${styles.flexCenter} md:mr-10 mr-0 md:mt-0 mt-10 relative`,
    sectionImg          : `flex-1 flex ${styles.flexCenter} md:ml-10 ml-0 md:mt-0 mt-10 relative`,

    sectionInfo         : `flex-1 ${styles.flexStart} flex-col`,
};

export default styles;
