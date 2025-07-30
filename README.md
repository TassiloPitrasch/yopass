
#
![Yopass-horizontal](https://user-images.githubusercontent.com/37777956/59544367-0867aa80-8f09-11e9-8d6a-02008e1bccc7.png)

# Yopass - Share Secrets Securely

**Please note: This is a fork of [jhaals/yopass](https://github.com/jhaals/yopass).**

Yopass is a project for sharing secrets in a quick and secure manner\*.
The sole purpose of Yopass is to minimize the amount of passwords floating around in ticket management systems, Slack messages and emails. The message is encrypted/decrypted locally in the browser and then sent to yopass without the decryption key which is only visible once during encryption, yopass then returns a one-time URL with specified expiry date.

**[Demo available here](https://yopass.se)**. It's recommended to host yopass yourself if you care about security.

- End-to-End encryption using [OpenPGP](https://openpgpjs.org/)
- Secrets can only be viewed once
- No accounts or user management required
- Secrets self destruct after X hours
- Custom password option
- Limited file upload functionality

*There is no perfect way of sharing secrets online and there is a trade off in every implementation. Yopass is designed to be as simple and "dumb" as possible without compromising on security. There's no mapping between the generated UUID and the user that submitted the encrypted message. It's always best to send all the context except password over another channel.


## Differences to the original project

1. Valkey is supported as a drop-in replacement for Redis. According compose-files have been added.
2. The expiration time can be set to (nearly) arbitrary values: Instead of only allowing an hour, a day or a week, the application's API accepts values between five minutes and 31 days. This is reflected both on the website (with the new option "One month") as well as in the command-line tool, which accepts the same range of values.
2. A secret's remaining time-to-live (TTL) is displayed when the secret is decrypted successfully. Note that this only works if using a Redis/Valkey-database. For one-time secrets, the notice to store/download the secret is enhanced.
3. The application's style is easier to adapt: In an .env-file (located in the website directory), the main color as well as a custom icon and logo can be defined. This is fully optional and the application will use the standard yopass design by default. See _Style_ for more details.
4. Deployment via Docker (compose) was modified in several ways:

    - A compose-file to securely deploy yopass with a Redis-database behind an nginx-proxy is available.
    - For Redis/Valkey, the data is stored in a separate volume to allow persistence after shutdowns/restarts.
    - Networking was reworked to better separate proxy, application and database.

6. The interface the server used to expose the metrics can be set via the command-line parameter `--metrics-address`. By default, the same interface is used as for the actual application. This might be useful for the more security-concerned users, as this enables them to host the metrics for local access only (by setting `--metrics-address` to 127.0.0.1 e.g.).
7. For more convenience when using the client, two additional mechanics were added:

    - The `--no-one-time parameter` - which can only be set on the command-line and not during build, via the environment or in one of the configuration-files - works as a more convenient alternative to the clumsy `--one-time=False`. It overwrites the configurations mentioned beforehand.
    - The value set for the yopass API also works as a fallback for the URL should URL not be defined anywhere.
	
8. Displaying a secret as a QR-code can be disabled by setting the respective environment-variable, similar to deactivating the upload-feature. See the website's [README](https://github.com/TassiloPitrasch/yopass/blob/main/website/README.md) for more details.



## Client (Command-line interface)

The main motivation of Yopass is to make it easy for everyone to share secrets easily and quickly via a simple web interface. Nevertheless, a command-line interface is provided as well to support use cases where the output of a program needs to be shared.

```console
$ yopass --help
Yopass - Secure sharing for secrets, passwords and files

Flags:
      --api string          Yopass API server location (default "localhost")
      --decrypt string      Decrypt secret URL
      --expiration string   Duration after which secret will be deleted [in [s]econds, [m]inutes, [h]ours, [d]ays, [w]eeks] (default "1h", minimum "5m", maximum "31d")
      --file string         Read secret from file instead of stdin
      --key string          Manual encryption/decryption key
      --one-time            One-time download (default true)
      --no-one-time         Multi-time download (default false, overwitetes the value of --one-time-download)
      --url string          Yopass public URL (default "localhost", uses value of option --api if empty)

Settings are read from flags, environment variables, or a config file located at
~/.config/yopass/defaults.<json,toml,yml,hcl,ini,...> in this order. Environment
variables have to be prefixed with YOPASS_ and dashes become underscores.

Examples:
      # Encrypt and share secret from stdin
      printf 'secret message' | yopass

      # Encrypt and share secret file
      yopass --file /path/to/secret.conf

      # Share secret multiple time a whole day
      cat secret-notes.md | yopass --expiration=1d --one-time=false

      # Decrypt secret to stdout
      yopass --decrypt https://yopass.se/#/...

Website: https://yopass.se
```

The following options are currently available to install the CLI locally.

- Compile from source (needs Go >= v1.24.1): 
```console
  go install github.com/TassiloPitrasch/yopass/cmd/yopass@latest
  ```

## Server Installation / Configuration

Here are the server configuration options.

Command line flags:

```console
$ yopass-server -h
      --address string     listen address (default 0.0.0.0)
      --database string    database backend ('memcached' or 'redis') (default "memcached")
      --max-length int     max length of encrypted secret (default 10000)
      --memcached string   Memcached address (default "localhost:11211")
      --metrics-address 	 listen address of the metrics server (defaults to the value of --address)
      --metrics-port int   metrics server listen port (default -1)
      --port int           listen port (default 1337)
      --redis string       Redis URL (default "redis://localhost:6379/0")
      --tls-cert string    path to TLS certificate
      --tls-key string     path to TLS key
      --cors-allow-origin  Access-Control-Allow-Origin CORS setting (default *)
```

Encrypted secrets can be stored either in Memcached or Redis/Valkey by changing the `--database` flag.

### Docker Compose

Use the files in `deploy/docker-compose/` to set up a yopass instance quickly via Docker compose. 
Run the variants `[memcached/redis/valkey]-with-nginx-proxy-and-letsencrypt` to include TLS transport encryption and certificate auto renewal using [Let's Encrypt](https://letsencrypt.org/). For this, point your domain to the host you want to run yopass on. Then replace the placeholder values for `VIRTUAL_HOST`, `LETSENCRYPT_HOST` and `LETSENCRYPT_EMAIL` in the respective file with your values. Afterwards change to the corresponding directory and start the containers with:

```console
docker-compose up -d
```

Yopass will then be available under the domain you specified through `VIRTUAL_HOST` / `LETSENCRYPT_HOST`.

Advanced users that already have a reverse proxy handling TLS connections can use the `insecure` setup:

```console
cd deploy/docker-compose/memcached-insecure OR
cd deploy/docker-compose/redis-insecure OR
cd deploy/docker-compose/valkey-insecure
docker-compose up -d
```

Afterwards point your reverse proxy to `127.0.0.1:80`.

#### Using a Redis database

If using Redis as the database, the data is stored in a Docker volume named `yopass_redis_data` to allow secrets to persist after container restarts.
Advanced users might want to protect their database with a password, which can be defined in the connection strings:

```
command: --database=redis --redis=redis://:${YOPASS_REDIS_PASSWORD}@yopass_redis:6379/0 --port 80 (for the yopass container)
command: redis-server --requirepass ${YOPASS_REDIS_PASSWORD} (for the Redis container)
```

To change the general Redis settings, a configuration-file (usually named `redis.conf`) can be used: `redis-server /etc/redis.conf`; the respective file must of course be available in the container.

Above set-ups should use environment variables to separate Docker infrastructure and custom settings.

#### Using a Valkey database
Valkey acts as drop-in replacement for Redis. The settings and connection string stays the same; just make sure to adapt the service/container name accordingly:
```
command: --database=redis --redis=redis://:${YOPASS_REDIS_PASSWORD}@yopass_valkey:6379/0 --port 80
```

### Docker

With TLS encryption

```console
docker run --name memcached_yopass -d memcached
docker run -p 443:1337 -v /local/certs/:/certs \
    --link memcached_yopass:memcached -d TassiloPitrasch/yopass --memcached=memcached:11211 --tls-key=/certs/tls.key --tls-cert=/certs/tls.crt
```

Afterwards yopass will be available on port 443 through all IP addresses of the host, including public ones. If you want to limit the availability to a specific IP address use `-p` like so: `-p 127.0.0.1:443:1337`.

Without TLS encryption (needs a reverse proxy for transport encryption):

```console
docker run --name memcached_yopass -d memcached
docker run -p 127.0.0.1:80:1337 --link memcached_yopass:memcached -d TassiloPitrasch/yopass --memcached=memcached:11211
```

Afterwards point your reverse proxy that handles the TLS connections to `127.0.0.1:80`.

### Kubernetes

```console
kubectl apply -f deploy/yopass-k8.yaml
kubectl port-forward service/yopass 1337:1337
```

_This is meant to get you started, please configure TLS when running yopass for real._

### Compile from source
Requires Go >= v1.24.1: 
```console
  go install github.com/TassiloPitrasch/yopass/cmd/yopass-server@latest
```

## Monitoring

Yopass optionally provides metrics in the [OpenMetrics][] / [Prometheus][] text
format. Use flag `--metrics-port <port>` to let Yopass start a second HTTP
server on that port making the metrics available on path `/metrics`.
To host the metrics server on a different interface than the actual application, use the `--metrics-address <address>` option.

Supported metrics:

- Basic [process metrics][] with prefix `process_` (e.g. CPU, memory, and file descriptor usage)
- Go runtime metrics with prefix `go_` (e.g. Go memory usage, garbage collection statistics, etc.)
- HTTP request metrics with prefix `yopass_http_` (HTTP request counter, and HTTP request latency histogram)

[openmetrics]: https://openmetrics.io/
[prometheus]: https://prometheus.io/
[process metrics]: https://prometheus.io/docs/instrumenting/writing_clientlibs/#process-metrics

## Style

If building the yopass Docker Image yourself, the application's style can easily be adapted using environment variables. The respective file should be located in `website`.  See below for an example.

    VITE_PRIMARY_COLOR="#607d8b3"
    VITE_LOGO="custom/logo.svg"
    VITE_ICON="custom/icon.svg"

 The resources for the icon and logo should be stored in `public/custom` (so that yopass will host them under the `/custom` endpoint referenced above).

## Translations

Yopass has third party support for other languages. That means you can write translations for the language you'd like or use a third party language file. Please note that yopass itself is english only and any other translations are community supported.

Here's a list of available translations:

- [Bahasa Indonesia](https://github.com/erolj/yopass-indonesian)
- [German](https://github.com/Anturix/yopass-german)
- [French](https://github.com/NicolasStr/yopass-french)
- [Spanish](https://github.com/nbensa/yopass-spanish)
- [Polish](https://github.com/mdurajewski/yopass-polish)
- [Dutch](https://github.com/KevinRosendaal/yopass-dutch)
- [Russian](https://github.com/karpechenkovkonstantin/yopass-russian)
- [Swedish](https://github.com/nkpg-kommun/yopass-swedish)
