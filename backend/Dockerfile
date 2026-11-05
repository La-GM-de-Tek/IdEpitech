FROM golang:1.27 AS build

WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/backend .

FROM alpine:3.22

RUN adduser -D -u 10001 app
USER app

COPY --from=build /out/backend /usr/local/bin/backend

EXPOSE 8080
CMD ["backend"]
