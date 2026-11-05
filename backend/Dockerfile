FROM golang:1.27

WORKDIR /app

COPY go.mod go.sum ./

RUN go mod download

COPY *.go ./

RUN go build -v -o /app/backend main.go

CMD ["app"]