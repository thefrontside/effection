FROM denoland/deno:1.34.1

COPY . /app
WORKDIR /app/www

RUN deno cache main.ts

EXPOSE 8000

CMD ["deno", "run", "--allow-read", "--allow-net=0.0.0.0,deno.land", "main.ts"]
