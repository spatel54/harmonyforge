import { useState, useRef } from 'react';
import ProcessingScreen from "./components/ProcessingScreen";
import InstrumentSelectionScreen from "./components/InstrumentSelectionScreen";
import ResultsScreen from "./components/ResultsScreen";
import InteractiveWorkspace from "./components/InteractiveWorkspace";
import VisualOnboarding from "./components/VisualOnboarding";
import ProjectsPage from "./components/ProjectsPage";
import ProfilePage from "./components/ProfilePage";
import Sidebar from "./components/Sidebar";
import { UploadZone, AnimatedTitle, UploadMessage } from "./components/home";
import { ProjectService } from "./services/projectService";

type Page = 'home' | 'projects' | 'profile';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | undefined>(undefined);
  const [uploadedFileData, setUploadedFileData] = useState<File | null>(null);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showInstrumentSelection, setShowInstrumentSelection] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [useInteractiveWorkspace, setUseInteractiveWorkspace] = useState(true); // Toggle for new workspace
  const [harmonyData, setHarmonyData] = useState<any | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | undefined>(undefined);
  const [currentSeed, setCurrentSeed] = useState<number | undefined>(undefined);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const validExtensions = ['.mid', '.midi', '.xml', '.musicxml'];
    const fileName = file.name.toLowerCase();
    
    if (!validExtensions.some(ext => fileName.endsWith(ext))) {
      return 'Please upload a MIDI or XML file';
    }
    
    if (file.size > maxSize) {
      return 'File size must be less than 50MB';
    }
    
    return null;
  };

  const handleFile = (file: File) => {
    const validationError = validateFile(file);
    
    if (validationError) {
      setError(validationError);
      setUploadedFile(undefined);
      setUploadedFileData(null);
      setTimeout(() => setError(undefined), 3000);
    } else {
      setError(undefined);
      setUploadedFile(file.name);
      setUploadedFileData(file);
      setIsProcessing(true);
      console.log('File ready to upload:', file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleGenerate = (data: any) => {
    console.log('[App.tsx] handleGenerate received data:', data);
    console.log('[App.tsx] data.harmonyOnly:', data.harmonyOnly);
    console.log('[App.tsx] data.combined:', data.combined);
    setHarmonyData(data);
    
    // Create project if using interactive workspace
    if (useInteractiveWorkspace && data.metadata) {
      const project = ProjectService.createProject(
        data.metadata.originalFilename || 'Untitled Project',
        data,
        currentSeed
      );
      setCurrentProjectId(project.id);
    }
    
    setShowResults(true);
  };
  
  const handleWorkspaceRegenerate = (options?: any) => {
    // Trigger regeneration with new options
    if (uploadedFileData && harmonyData?.instruments) {
      // This would call the API again with new options
      console.log('[App] Regenerating with options:', options);
      // For now, just update harmonyData - full implementation would call API
    }
  };
  
  const handleWorkspaceSave = (versionData: any) => {
    if (currentProjectId) {
      ProjectService.saveVersion({
        ...versionData,
        projectId: currentProjectId,
      });
    }
  };

  const handleRegenerate = () => {
    setShowResults(false);
    setShowInstrumentSelection(true);
  };

  const handleGenerateNew = () => {
    setShowResults(false);
    setShowInstrumentSelection(false);
    setIsProcessing(false);
    setUploadedFile(undefined);
    setUploadedFileData(null);
    setHarmonyData(null);
  };

  const handleNavigateHome = () => {
    setCurrentPage('home');
    setShowResults(false);
    setShowInstrumentSelection(false);
    setIsProcessing(false);
    setUploadedFile(undefined);
    setHarmonyData(null);
  };

  const handleNavigateProjects = () => {
    setCurrentPage('projects');
  };

  const handleNavigateProfile = () => {
    setCurrentPage('profile');
  };

  // Show Projects Page
  if (currentPage === 'projects') {
    return (
      <>
        <Sidebar 
          onHomeClick={handleNavigateHome}
          onProjectsClick={handleNavigateProjects}
          onProfileClick={handleNavigateProfile}
        />
        <ProjectsPage />
      </>
    );
  }

  // Show Profile Page
  if (currentPage === 'profile') {
    return (
      <>
        <Sidebar 
          onHomeClick={handleNavigateHome}
          onProjectsClick={handleNavigateProjects}
          onProfileClick={handleNavigateProfile}
        />
        <ProfilePage />
      </>
    );
  }

  if (showResults && harmonyData) {
    // Use Interactive Workspace if enabled, otherwise use Results Screen
    if (useInteractiveWorkspace) {
      return (
        <>
          <Sidebar 
            onHomeClick={handleNavigateHome}
            onProjectsClick={handleNavigateProjects}
            onProfileClick={handleNavigateProfile}
          />
          <InteractiveWorkspace
            data={harmonyData}
            onRegenerate={handleWorkspaceRegenerate}
            onSave={handleWorkspaceSave}
            projectId={currentProjectId}
            seed={currentSeed}
          />
          {showOnboarding && (
            <VisualOnboarding onComplete={() => setShowOnboarding(false)} />
          )}
        </>
      );
    }
    
    return (
      <>
        <Sidebar 
          onHomeClick={handleNavigateHome}
          onProjectsClick={handleNavigateProjects}
          onProfileClick={handleNavigateProfile}
        />
        <ResultsScreen 
          data={harmonyData}
          onRegenerate={handleRegenerate}
          onGenerateNew={handleGenerateNew}
        />
      </>
    );
  }

  if (showInstrumentSelection) {
    return (
      <>
        <Sidebar 
          onHomeClick={handleNavigateHome}
          onProjectsClick={handleNavigateProjects}
          onProfileClick={handleNavigateProfile}
        />
        <InstrumentSelectionScreen 
          onGenerate={handleGenerate} 
          uploadedFile={uploadedFileData}
        />
      </>
    );
  }

  if (isProcessing) {
    return (
      <>
        <Sidebar 
          onHomeClick={handleNavigateHome}
          onProjectsClick={handleNavigateProjects}
          onProfileClick={handleNavigateProfile}
        />
        <ProcessingScreen 
          onComplete={() => setShowInstrumentSelection(true)} 
          fileName={uploadedFile}
        />
      </>
    );
  }

  console.log('[App] Rendering home page. State:', { 
    currentPage, 
    isDragging, 
    uploadedFile, 
    isProcessing, 
    showInstrumentSelection, 
    showResults 
  });

  return (
    <>
      <Sidebar 
        onHomeClick={handleNavigateHome}
        onProjectsClick={handleNavigateProjects}
        onProfileClick={handleNavigateProfile}
      />
      <div className="bg-white relative w-full h-screen overflow-hidden" data-name="MacBook Pro 16' - 1" style={{ zIndex: 1 }}>
        {/* Debug: Always visible test element */}
        <div style={{ 
          position: 'fixed', 
          top: '10px', 
          right: '10px', 
          background: 'red', 
          color: 'white', 
          padding: '10px', 
          zIndex: 9999,
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          React is working!
        </div>
        
        <div 
          className="absolute bg-[#f8f3eb] inset-0 w-full h-full overflow-hidden"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <UploadZone isHovering={isDragging} onClick={handleClick} />
          <AnimatedTitle />
          <UploadMessage fileName={uploadedFile} error={error} />
          <input
            ref={fileInputRef}
            type="file"
            accept=".mid,.midi,.xml,.musicxml"
            onChange={handleFileInput}
            className="hidden"
            aria-label="Upload MIDI or XML file"
          />
        </div>
      </div>
    </>
  );
}
