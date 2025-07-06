import ImageGenerator from "../components/ImageGenerator";
import TerminalOutput from "../components/TerminalOutput";

export default function MainScreen() {
  return (
    <div className="relative min-h-screen py-8">
      {/* Main Content Grid */}
      <div className="relative z-10 container mx-auto px-6 pb-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Image Generator Section */}
          <div className="space-y-6 min-h-0 xl:col-span-2">
            <div className="overflow-hidden">
              <ImageGenerator />
            </div>
          </div>

          {/* Terminal Output Section */}
          <div className="space-y-6 min-h-0">
            <div className="sticky top-6 z-30">
              <TerminalOutput />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
