import { useTheme } from '../contexts/ThemeContext';
import WorkspaceHub from '../components/workspace/WorkspaceHub';

export default function WorkspacePage() {
  const { theme } = useTheme();
  const darkMode = theme === 'dark';

  return <WorkspaceHub darkMode={darkMode} />;
}
