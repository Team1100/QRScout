import logoSvg from '@/assets/RedHawkRobotics-logo.svg';

export function Logo() {
  return (
    <img 
      src={logoSvg} 
      alt="Team Logo" 
      className="h-full w-full object-contain mx-auto"
    />
  );
}
