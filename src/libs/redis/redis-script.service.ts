import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { readFile } from 'fs/promises';
import Redis from 'ioredis';
import { join } from 'path';
import { AppLogger } from 'src/logger/logger.service';
import { LogConstants } from '@/constants/log.constant';
import { RedisScriptName, RedisScripts } from './redis-scripts.registry';

/**
 * Service responsible for loading, storing, and executing Redis scripts.
 * Scripts are loaded on application startup and cached by SHA for performance.
 */
@Injectable()
export class RedisScriptService implements OnModuleInit {
  private readonly scripts = new Map<RedisScriptName, string>();

  constructor(
    @Inject('REDIS_CLIENT') readonly redis: Redis,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(RedisScriptService.name);
  }

  /**
   * Initializes all Redis scripts on module startup.
   * Exits the process if scripts fail to load within 10 seconds.
   */
  async onModuleInit(): Promise<void> {
    this.logger.infoStructured(LogConstants.SYSTEM.INFO_INIT_SCRIPTS, {
      phase: 'init_start',
    });

    const initTimeout = setTimeout(() => {
      this.logger.errorStructured(
        LogConstants.SYSTEM.ERROR_INIT_SCRIPTS_TIMEOUT,
        {
          phase: 'init_timeout',
        },
      );
      process.exit(1);
    }, 10_000);

    try {
      const scriptNames = Object.keys(RedisScripts) as RedisScriptName[];
      await Promise.all(scriptNames.map((name) => this.loadScript(name)));
      clearTimeout(initTimeout);
      this.logger.infoStructured(LogConstants.SYSTEM.INFO_SCRIPTS_LOADED, {
        phase: 'init_complete',
      });
    } catch (err) {
      clearTimeout(initTimeout);
      this.logger.errorStructured(
        LogConstants.SYSTEM.ERROR_INIT_SCRIPTS_FAILED,
        {
          phase: 'init_failed',
          error: err,
        },
      );
      process.exit(1);
    }
  }

  /**
   * Loads a single Redis script into Redis and stores its SHA hash.
   * @param name Name of the Redis script to load.
   * @returns SHA hash of the loaded script.
   * @throws Throws if reading the file or loading to Redis fails.
   */
  private async loadScript(name: RedisScriptName): Promise<string> {
    const scriptConfig = RedisScripts[name];
    const scriptPath = join(__dirname, 'scripts', scriptConfig.file);

    this.logger.debugStructured(LogConstants.SYSTEM.DEBUG_LOADING_SCRIPT, {
      scriptName: name,
      path: scriptPath,
    });

    let content: string;
    try {
      content = await readFile(scriptPath, 'utf8');
    } catch (err) {
      const message = LogConstants.SYSTEM.ERROR_READ_SCRIPT_FAILED.replace(
        '{file}',
        scriptConfig.file,
      );
      this.logger.errorStructured(message, { scriptName: name, error: err });
      throw new Error(message);
    }

    try {
      // Timeout for Redis SCRIPT LOAD
      const sha = (await Promise.race([
        this.redis.script('LOAD', content),
        new Promise<string>((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error(LogConstants.SYSTEM.ERROR_INIT_SCRIPTS_TIMEOUT),
              ),
            5_000,
          ),
        ),
      ])) as string;

      this.scripts.set(name, sha);
      this.logger.debugStructured(LogConstants.SYSTEM.DEBUG_SCRIPT_LOADED, {
        scriptName: name,
        sha,
      });
      return sha;
    } catch (err) {
      const message = LogConstants.SYSTEM.ERROR_LOAD_SCRIPT_FAILED.replace(
        '{name}',
        name,
      );
      this.logger.errorStructured(message, { scriptName: name, error: err });
      throw new Error(message);
    }
  }

  /**
   * Executes a Redis script by SHA, automatically reloads if NOSCRIPT occurs.
   * @param name Name of the Redis script to execute.
   * @param keys Array of Redis keys to pass to the script.
   * @param args Array of arguments to pass to the script.
   * @returns Result of the script execution.
   * @throws Throws if the script is not loaded or Redis evaluation fails.
   */
  async eval(
    name: RedisScriptName,
    keys: string[],
    args: (string | number)[],
  ): Promise<any> {
    const sha = this.scripts.get(name);
    if (!sha)
      throw new Error(
        LogConstants.SYSTEM.ERROR_LOAD_SCRIPT_FAILED.replace('{name}', name),
      );

    try {
      return await this.redis.evalsha(
        sha,
        keys.length,
        ...keys,
        ...args.map(String),
      );
    } catch (err: any) {
      if (err?.message?.includes('NOSCRIPT')) {
        this.logger.warnStructured(LogConstants.SYSTEM.WARN_NOSCRIPT, {
          scriptName: name,
        });
        const newSha = await this.loadScript(name);
        return this.redis.evalsha(
          newSha,
          keys.length,
          ...keys,
          ...args.map(String),
        );
      }
      throw err;
    }
  }
}
