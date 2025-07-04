import SyllabusCard from "@/components/01 - Home/Cards/SyllabusCard";

export default function Syllabus() {
  const handleCourseClick = (courseTitle: string) => {
    console.log(`Navigating to: ${courseTitle}`);
    // TODO: Add navigation logic here
  };

  return (
    <div class="flex flex-col rounded-md items-center justify-start h-full w-full overflow-y-scroll mt-20 overflow-x-hidden">
      <div class="bg-sidebar gap-4 w-[80vw] h-full p-4 border border-white/40 overflow-y-auto space-y-4 pb-40">
        
        {/* Chapter 1 */}
        <SyllabusCard type="outer" title="Chapter 1 - Introduction to Signal Processing" defaultOpen={true}>
          <div class="space-y-2">
            <div 
              class="p-3 bg-sidebar-light-1 rounded-lg cursor-pointer hover:bg-sidebar-light-2 transition-colors"
              onClick={() => handleCourseClick("Fundamentals of Signals and Systems")}
            >
              <h4 class="font-medium text-gray-300">Fundamentals of Signals and Systems</h4>
              <p class="text-sm text-gray-500">Introduction to continuous and discrete-time signals</p>
            </div>
            <div 
              class="p-3 bg-sidebar-light-1 rounded-lg cursor-pointer hover:bg-sidebar-light-2 transition-colors"
              onClick={() => handleCourseClick("Signal Classification and Properties")}
            >
              <h4 class="font-medium text-gray-300">Signal Classification and Properties</h4>
              <p class="text-sm text-gray-500">Periodic, aperiodic, even, odd, and energy signals</p>
            </div>
          </div>
        </SyllabusCard>

        {/* Chapter 2 */}
        <SyllabusCard type="outer" title="Chapter 2 - Time Domain Analysis">
          <div class="space-y-2">
            <div 
              class="p-3 bg-sidebar-light-1 rounded-lg cursor-pointer hover:bg-sidebar-light-2 transition-colors"
              onClick={() => handleCourseClick("Convolution and Correlation")}
            >
              <h4 class="font-medium text-gray-300">Convolution and Correlation</h4>
              <p class="text-sm text-gray-500">Linear time-invariant systems and impulse response</p>
            </div>
            <div 
              class="p-3 bg-sidebar-light-1 rounded-lg cursor-pointer hover:bg-sidebar-light-2 transition-colors"
              onClick={() => handleCourseClick("System Response Analysis")}
            >
              <h4 class="font-medium text-gray-300">System Response Analysis</h4>
              <p class="text-sm text-gray-500">Step response, impulse response, and system stability</p>
            </div>
          </div>
        </SyllabusCard>

        {/* Chapter 3 */}
        <SyllabusCard type="outer" title="Chapter 3 - Frequency Domain Analysis">
          <div class="space-y-2">
            <div 
              class="p-3 bg-sidebar-light-1 rounded-lg cursor-pointer hover:bg-sidebar-light-2 transition-colors"
              onClick={() => handleCourseClick("Fourier Series and Transform")}
            >
              <h4 class="font-medium text-gray-300">Fourier Series and Transform</h4>
              <p class="text-sm text-gray-500">Frequency representation of continuous signals</p>
            </div>
            <div 
              class="p-3 bg-sidebar-light-1 rounded-lg cursor-pointer hover:bg-sidebar-light-2 transition-colors"
              onClick={() => handleCourseClick("Discrete Fourier Transform")}
            >
              <h4 class="font-medium text-gray-300">Discrete Fourier Transform</h4>
              <p class="text-sm text-gray-500">DFT properties and computational aspects</p>
            </div>
          </div>
        </SyllabusCard>

        {/* Chapter 4 */}
        <SyllabusCard type="outer" title="Chapter 4 - Sampling and Reconstruction">
          <div class="space-y-2">
            <div 
              class="p-3 bg-sidebar-light-1 rounded-lg cursor-pointer hover:bg-sidebar-light-2 transition-colors"
              onClick={() => handleCourseClick("Sampling Theorem")}
            >
              <h4 class="font-medium text-gray-300">Sampling Theorem</h4>
              <p class="text-sm text-gray-500">Nyquist rate and aliasing effects</p>
            </div>
            <div 
              class="p-3 bg-sidebar-light-1 rounded-lg cursor-pointer hover:bg-sidebar-light-2 transition-colors"
              onClick={() => handleCourseClick("Signal Reconstruction")}
            >
              <h4 class="font-medium text-gray-300">Signal Reconstruction</h4>
              <p class="text-sm text-gray-500">Interpolation and reconstruction filters</p>
            </div>
          </div>
        </SyllabusCard>

        {/* Chapter 5 */}
        <SyllabusCard type="outer" title="Chapter 5 - Digital Filter Design">
          <div class="space-y-2">
            <div 
              class="p-3 bg-sidebar-light-1 rounded-lg cursor-pointer hover:bg-sidebar-light-2 transition-colors"
              onClick={() => handleCourseClick("FIR Filter Design")}
            >
              <h4 class="font-medium text-gray-300">FIR Filter Design</h4>
              <p class="text-sm text-gray-500">Finite impulse response filter design methods</p>
            </div>
            <div 
              class="p-3 bg-sidebar-light-1 rounded-lg cursor-pointer hover:bg-sidebar-light-2 transition-colors"
              onClick={() => handleCourseClick("IIR Filter Design")}
            >
              <h4 class="font-medium text-gray-300">IIR Filter Design</h4>
              <p class="text-sm text-gray-500">Infinite impulse response filter design</p>
            </div>
          </div>
        </SyllabusCard>

        {/* Chapter 6 */}
        <SyllabusCard type="outer" title="Chapter 6 - Z-Transform Analysis">
          <div class="space-y-2">
            <div 
              class="p-3 bg-sidebar-light-1 rounded-lg cursor-pointer hover:bg-sidebar-light-2 transition-colors"
              onClick={() => handleCourseClick("Z-Transform Properties")}
            >
              <h4 class="font-medium text-gray-300">Z-Transform Properties</h4>
              <p class="text-sm text-gray-500">Region of convergence and inverse Z-transform</p>
            </div>
            <div 
              class="p-3 bg-sidebar-light-1 rounded-lg cursor-pointer hover:bg-sidebar-light-2 transition-colors"
              onClick={() => handleCourseClick("System Function Analysis")}
            >
              <h4 class="font-medium text-gray-300">System Function Analysis</h4>
              <p class="text-sm text-gray-500">Poles, zeros, and frequency response</p>
            </div>
          </div>
        </SyllabusCard>

        {/* Chapter 7 */}
        <SyllabusCard type="outer" title="Chapter 7 - Fast Fourier Transform">
          <div class="space-y-2">
            <div 
              class="p-3 bg-sidebar-light-1 rounded-lg cursor-pointer hover:bg-sidebar-light-2 transition-colors"
              onClick={() => handleCourseClick("FFT Algorithms")}
            >
              <h4 class="font-medium text-gray-300">FFT Algorithms</h4>
              <p class="text-sm text-gray-500">Decimation-in-time and decimation-in-frequency</p>
            </div>
            <div 
              class="p-3 bg-sidebar-light-1 rounded-lg cursor-pointer hover:bg-sidebar-light-2 transition-colors"
              onClick={() => handleCourseClick("FFT Applications")}
            >
              <h4 class="font-medium text-gray-300">FFT Applications</h4>
              <p class="text-sm text-gray-500">Spectral analysis and computational efficiency</p>
            </div>
          </div>
        </SyllabusCard>

        {/* Chapter 8 */}
        <SyllabusCard type="outer" title="Chapter 8 - Multirate Signal Processing">
          <div class="space-y-2">
            <div 
              class="p-3 bg-sidebar-light-1 rounded-lg cursor-pointer hover:bg-sidebar-light-2 transition-colors"
              onClick={() => handleCourseClick("Decimation and Interpolation")}
            >
              <h4 class="font-medium text-gray-300">Decimation and Interpolation</h4>
              <p class="text-sm text-gray-500">Sampling rate conversion techniques</p>
            </div>
            <div 
              class="p-3 bg-sidebar-light-1 rounded-lg cursor-pointer hover:bg-sidebar-light-2 transition-colors"
              onClick={() => handleCourseClick("Polyphase Structures")}
            >
              <h4 class="font-medium text-gray-300">Polyphase Structures</h4>
              <p class="text-sm text-gray-500">Efficient multirate system implementations</p>
            </div>
          </div>
        </SyllabusCard>

        {/* Chapter 9 */}
        <SyllabusCard type="outer" title="Chapter 9 - Adaptive Signal Processing">
          <div class="space-y-2">
            <div 
              class="p-3 bg-sidebar-light-1 rounded-lg cursor-pointer hover:bg-sidebar-light-2 transition-colors"
              onClick={() => handleCourseClick("Adaptive Filters")}
            >
              <h4 class="font-medium text-gray-300">Adaptive Filters</h4>
              <p class="text-sm text-gray-500">LMS and RLS algorithms</p>
            </div>
            <div 
              class="p-3 bg-sidebar-light-1 rounded-lg cursor-pointer hover:bg-sidebar-light-2 transition-colors"
              onClick={() => handleCourseClick("Wiener Filtering")}
            >
              <h4 class="font-medium text-gray-300">Wiener Filtering</h4>
              <p class="text-sm text-gray-500">Optimal filtering and noise reduction</p>
            </div>
          </div>
        </SyllabusCard>

        {/* Chapter 10 */}
        <SyllabusCard type="outer" title="Chapter 10 - Spectral Estimation">
          <div class="space-y-2">
            <div 
              class="p-3 bg-sidebar-light-1 rounded-lg cursor-pointer hover:bg-sidebar-light-2 transition-colors"
              onClick={() => handleCourseClick("Parametric Methods")}
            >
              <h4 class="font-medium text-gray-300">Parametric Methods</h4>
              <p class="text-sm text-gray-500">AR, MA, and ARMA models</p>
            </div>
            <div 
              class="p-3 bg-sidebar-light-1 rounded-lg cursor-pointer hover:bg-sidebar-light-2 transition-colors"
              onClick={() => handleCourseClick("Non-parametric Methods")}
            >
              <h4 class="font-medium text-gray-300">Non-parametric Methods</h4>
              <p class="text-sm text-gray-500">Periodogram and Welch's method</p>
            </div>
          </div>
        </SyllabusCard>

        {/* Chapter 11 */}
        <SyllabusCard type="outer" title="Chapter 11 - Statistical Signal Processing">
          <div class="space-y-2">
            <div 
              class="p-3 bg-sidebar-light-1 rounded-lg cursor-pointer hover:bg-sidebar-light-2 transition-colors"
              onClick={() => handleCourseClick("Random Signals")}
            >
              <h4 class="font-medium text-gray-300">Random Signals</h4>
              <p class="text-sm text-gray-500">Stochastic processes and correlation functions</p>
            </div>
            <div 
              class="p-3 bg-sidebar-light-1 rounded-lg cursor-pointer hover:bg-sidebar-light-2 transition-colors"
              onClick={() => handleCourseClick("Detection Theory")}
            >
              <h4 class="font-medium text-gray-300">Detection Theory</h4>
              <p class="text-sm text-gray-500">Hypothesis testing and signal detection</p>
            </div>
          </div>
        </SyllabusCard>

        {/* Chapter 12 */}
        <SyllabusCard type="outer" title="Chapter 12 - Applications and Modern Techniques">
          <div class="space-y-2">
            <div 
              class="p-3 bg-sidebar-light-1 rounded-lg cursor-pointer hover:bg-sidebar-light-2 transition-colors"
              onClick={() => handleCourseClick("Image Processing")}
            >
              <h4 class="font-medium text-gray-300">Image Processing</h4>
              <p class="text-sm text-gray-500">2D signal processing and image enhancement</p>
            </div>
            <div 
              class="p-3 bg-sidebar-light-1 rounded-lg cursor-pointer hover:bg-sidebar-light-2 transition-colors"
              onClick={() => handleCourseClick("Audio Processing")}
            >
              <h4 class="font-medium text-gray-300">Audio Processing</h4>
              <p class="text-sm text-gray-500">Speech processing and audio enhancement</p>
            </div>
            <div 
              class="p-3 bg-sidebar-light-1 rounded-lg cursor-pointer hover:bg-sidebar-light-2 transition-colors"
              onClick={() => handleCourseClick("Machine Learning Applications")}
            >
              <h4 class="font-medium text-gray-300">Machine Learning Applications</h4>
              <p class="text-sm text-gray-500">Deep learning for signal processing</p>
            </div>
          </div>
        </SyllabusCard>

      </div>
    </div>
  );
};