import { useAtom } from "jotai";
import { ConfigRenderer } from "./ConfigRenderer";
import { configAtom, layersAtom } from "./state/configAtom";
import { useEffect } from "react";
import { getMapLayers } from "./utils/getMapLayers";
import { SplashScreen } from "./components/SplashScreen";
import { useQuery } from "@tanstack/react-query";

const getConfig = async () => {
  const fetchData = await fetch("/config.json");
  return await fetchData.json();
};

export const ConfigFetcher = ({ config: providedConfig }) => {
  const [config, setConfig] = useAtom(configAtom);
  const [layers, setLayers] = useAtom(layersAtom);

  const { data: configData, status: configStatus } = useQuery({
    queryKey: ["config"],
    queryFn: getConfig,
    enabled: !providedConfig, // Only fetch if no config is provided
  });

  useEffect(() => {
    // If a config is provided directly, use it
    if (providedConfig) {
      console.log('[Viewer] Using provided config:', providedConfig);
      getMapLayers(providedConfig.sources).then((layersData) => {
        const filteredLayers = layersData.filter((layer) => layer !== null && layer !== undefined);
        setLayers(filteredLayers);
      });
      setConfig(providedConfig);
      
      // Apply theme from config
      const configTheme = providedConfig?.layout?.theme;
      console.log('[Viewer ConfigFetcher] Provided config theme:', configTheme);
      if (configTheme) {
        console.log('[Viewer ConfigFetcher] Applying theme properties to document root:');
        Object.entries(configTheme).forEach(([key, value]) => {
          console.log(`[Viewer ConfigFetcher]   --${key}: ${value}`);
          document.documentElement.style.setProperty(`--${key}`, value);
        });
        console.log('[Viewer ConfigFetcher] Theme properties applied successfully');
      } else {
        console.log('[Viewer ConfigFetcher] No theme found in provided config');
      }
      
      return;
    }

    // Otherwise, wait for fetch to complete
    if (configStatus === "pending") {
      return;
    }

    getMapLayers(configData.sources).then((layersData) => {
      const filteredLayers = layersData.filter((layer) => layer !== null && layer !== undefined);
      setLayers(filteredLayers)
    });

    setConfig(configData);
    
    // Apply theme from config
    const configTheme = configData?.layout?.theme;
    console.log('[Viewer ConfigFetcher] Fetched config theme:', configTheme);
    if (configTheme) {
      console.log('[Viewer ConfigFetcher] Applying theme properties to document root:');
      Object.entries(configTheme).forEach(([key, value]) => {
        console.log(`[Viewer ConfigFetcher]   --${key}: ${value}`);
        document.documentElement.style.setProperty(`--${key}`, value);
      });
      console.log('[Viewer ConfigFetcher] Theme properties applied successfully');
    } else {
      console.log('[Viewer ConfigFetcher] No theme found in fetched config');
    }
  }, [providedConfig, configData, configStatus, setConfig, setLayers]);

  return config && layers && layers.length > 0 ? <ConfigRenderer /> : <SplashScreen />;
};

export default ConfigFetcher;
