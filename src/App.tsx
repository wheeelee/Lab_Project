import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Editor from './screens/Editor';
import Gallery from './screens/Gallery';
import {
  addProjectToIndex,
  loadProjectIndex,
  ProjectIndexEntry,
} from './lib/projectStorage';

function App() {
  const [projects, setProjects] = useState<ProjectIndexEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjectIndex()
      .then(setProjects)
      .finally(() => setLoading(false));
  }, []);

  const addProject = async (name: string) => {
    const now = new Date().toISOString();
    const newProject: ProjectIndexEntry = {
      id: Date.now(),
      name,
      createdAt: now,
      updatedAt: now,
    };

    await addProjectToIndex(newProject);
    setProjects((prev) => [...prev, newProject]);
  };

  const refreshProjects = async () => {
    const index = await loadProjectIndex();
    setProjects(index);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Загрузка проектов...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-950 text-white">
        <header className="p-4 border-b border-slate-800">
          <h1 className="text-4xl font-bold text-center">Графический редактор</h1>
        </header>
        <main className="p-4">
          <Routes>
            <Route
              path="/"
              element={<Gallery projects={projects} addProject={addProject} />}
            />
            <Route
              path="/editor/:id"
              element={<Editor projects={projects} onProjectSaved={refreshProjects} />}
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
