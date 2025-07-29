package main

import (
	"fmt"
	"io"
	"os"
	"strconv"
	"strings"

	"github.com/TassiloPitrasch/yopass/pkg/yopass"
	"github.com/spf13/pflag"
	"github.com/spf13/viper"
)

const usageTemplate = `
Yopass - Secure sharing for secrets, passwords and files

Flags:
%s

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

Website: %s
`

var (
	defaultAPI = "http://localhost"
	defaultURL = "http://localhost"
)

// Mapping between time units and seconds
var timeFactors = map[string]int{
	// Seconds
	"s": 1,
	// Minutes
	"m": 60,
	// Hours
	"h": 60 * 60,
	// Days
	"d": 60 * 60 * 24,
	// Weeks
	"w": 60 * 60 * 24 * 7,
}

func init() {
	// Use build-time values if set; otherwise, fall back to hardcoded defaults.
	// Build with -ldflags "-X main.defaultAPI=https://your-custom-api.com -X main.defaultURL=https://your-custom-url.com" to override defaults
	viper.SetDefault("api", defaultAPI)
	viper.SetDefault("url", defaultURL)
	viper.SetDefault("one-time", true)
	viper.SetDefault("expiration", "1h")

	// Config file
	viper.SetConfigName("defaults")
	viper.AddConfigPath("$HOME/.config/yopass")
	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			fmt.Fprintln(os.Stderr, "Yopass config file invalid:", err)
			os.Exit(3)
		}
	}

	// Environment variables
	viper.SetEnvPrefix("yopass")
	viper.SetEnvKeyReplacer(strings.NewReplacer("-", "_"))
	viper.AutomaticEnv()

	// Command-line flags
	pflag.CommandLine = pflag.NewFlagSet(os.Args[0], pflag.ContinueOnError)
	pflag.String("api", viper.GetString("api"), "Yopass API server location")
	pflag.String("decrypt", viper.GetString("decrypt"), "Decrypt secret URL")
	pflag.String("expiration", viper.GetString("expiration"), "Duration after which secret will be deleted [from five minutes to one month]")
	pflag.String("file", viper.GetString("file"), "Read secret from file instead of stdin")
	pflag.String("key", viper.GetString("key"), "Manual encryption/decryption key")
	pflag.Bool("one-time", viper.GetBool("one-time"), "One-time download")
	pflag.Bool("no-one-time", viper.GetBool("no-one-time"), "Disabling one-time download")
	pflag.String("url", viper.GetString("url"), "Yopass public URL")
	viper.BindPFlags(pflag.CommandLine)
}

func main() {
	if code := parse(os.Args[1:], os.Stderr); code >= 0 {
		os.Exit(code)
	}

	var err error
	if viper.IsSet("decrypt") {
		err = decrypt(os.Stdout)
	} else {
		err = encryptStdinOrFile(os.Stdin, os.Stdout)
	}

	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}

func decrypt(out io.Writer) error {
	if !strings.HasPrefix(viper.GetString("decrypt"), viper.GetString("url")) {
		return fmt.Errorf("Unconfigured yopass decrypt URL, set --api and --url")
	}

	id, key, _, keyOpt, err := yopass.ParseURL(viper.GetString("decrypt"))
	if err != nil {
		return fmt.Errorf("Invalid yopass decrypt URL: %w", err)
	}

	if keyOpt || key == "" {
		if !viper.IsSet("key") {
			return fmt.Errorf("Manual decryption key required, set --key")
		}
		key = viper.GetString("key")
	}

	msg, err := yopass.Fetch(viper.GetString("api"), id)
	if err != nil {
		return fmt.Errorf("Failed to fetch secret: %w", err)
	}

	pt, _, err := yopass.Decrypt(strings.NewReader(msg), key)
	if err != nil {
		return fmt.Errorf("Failed to decrypt secret: %w", err)
	}

	// Note yopass decrypt currently always prints the content to stdout. This
	// could be changed to create a file, but will need to handle the case that
	// the file already exists.
	_, err = fmt.Fprint(out, pt)
	return err
}

func encryptStdinOrFile(in *os.File, out io.Writer) error {
	if viper.IsSet("file") {
		return encryptFileByName(viper.GetString("file"), out)
	}
	return encryptStdin(in, out)
}

func encryptFileByName(filename string, out io.Writer) error {
	var in, err = os.Open(filename)
	defer in.Close()
	if err != nil {
		return fmt.Errorf("Failed to open file: %w", err)
	}
	return encrypt(in, out)
}

func encryptStdin(in *os.File, out io.Writer) error {
	var info, err = in.Stat()
	if err != nil {
		return fmt.Errorf("Failed to get file info: %w", err)
	}
	if info.Mode()&os.ModeCharDevice != 0 {
		return fmt.Errorf("No filename or piped input to encrypt given")
	}
	return encrypt(in, out)
}

func encrypt(in io.ReadCloser, out io.Writer) error {
	api := viper.GetString("api")
	if api == "" {
		return fmt.Errorf("No Yopass API url set")
	}

	exp := expiration(viper.GetString("expiration"))
	if exp == 0 {
		return fmt.Errorf("Expiration time out of range or malformed")
	}

	key, err := encryptionKey(viper.GetString("key"))
	if err != nil {
		return fmt.Errorf("Failed to generate encryption key: %w", err)
	}

	msg, err := yopass.Encrypt(in, key)
	if err != nil {
		return fmt.Errorf("Failed to encrypt secret: %w", err)
	}

	// --no-one-time overwrites the default behaviour
	one_time := viper.GetBool("one-time")
	if viper.GetBool("no-one-time") {
		one_time = false
	}

	id, err := yopass.Store(api, yopass.Secret{
		Expiration: exp,
		Message:    msg,
		OneTime:    one_time,
	})
	if err != nil {
		return fmt.Errorf("Failed to store secret: %w", err)
	}

	url := viper.GetString("url")
	if url == "" {
		url = api
	}
	_, err = fmt.Fprintln(out, yopass.SecretURL(url, id, key, viper.IsSet("file"), viper.IsSet("key")))
	return err
}

func encryptionKey(key string) (string, error) {
	if key != "" {
		return key, nil
	}
	return yopass.GenerateKey()
}

func expiration(s string) int32 {
	// Getting the factor corresponding to the provided time unit
	// If the unit is missing or unknown, the factor is 0
	timeUnit := s[len(s)-1:]
	timeFactor := timeFactors[timeUnit]

	// Parsing the provided numerical value
	value, err := strconv.Atoi(s[:len(s)-1])
	if err != nil {
		value = 0
	}

	// Calculating the time-to-live in seconds and range check
	// If either the factor or the value is 0, the result will also be 0 and therefore out of range
	result := timeFactor * value
	if result < 60 || result > 2592000 {
		return 0
	}

	return int32(result)
}

func parse(args []string, stderr io.Writer) int {
	pflag.Usage = func() {
		fmt.Fprintf(
			stderr,
			strings.TrimPrefix(usageTemplate, "\n"),
			strings.TrimSuffix(pflag.CommandLine.FlagUsages(), "\n"),
			viper.Get("url"),
		)
	}

	if err := pflag.CommandLine.Parse(args); err != nil {
		if err == pflag.ErrHelp {
			return 0
		}
		fmt.Fprintln(stderr, err)
		return 1
	}

	// It's not allowed to have both the one-time and no-one-time flag defined
	if checkFlagDefined("no-one-time") && checkFlagDefined("one-time") {
		fmt.Fprintln(stderr, "Contradicting command-line options given")
                return 1
	}

	return -1
}

func checkFlagDefined(flag_name string) (found bool) {
	pflag.Visit(func(f *pflag.Flag) {
		if f.Name == flag_name {
			found = true
		}
        })
	return found
}
