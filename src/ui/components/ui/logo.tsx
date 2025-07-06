import logo from "@/assets/logo.png";

export default function Logo({ className }: { className?: string }) {
  return <img src={logo} alt="logo" className={`w-12 h-12 ${className}`} />;
}
