import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const BackToDashboard = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate("/merchant/dashboard")}
      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
    >
      <ArrowLeft size={16} />
      <span>Dashboard</span>
    </button>
  );
};

export default BackToDashboard;
